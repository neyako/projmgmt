"use client";

import {
  type ClipboardEvent,
  type FocusEvent,
  type FormEvent as ReactFormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createProject,
  getUsers,
  updateProjectMetadata,
  updateProjectShotlist,
  updateProjectAssets,
  updatePlatformIds,
  updateProjectStatusDirect,
  toggleProjectPlatform,
} from "@/actions/projects";
import { updateProjectScript } from "@/app/actions";
import { useToast } from "@/components/ui/Toast";
import { CONTENT_TYPES, FORMATS, PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { parsePlatforms } from "@/lib/utils";
import ShotRow from "@/components/kanban/ShotRow";
import CopyBlock from "@/components/ui/CopyBlock";
import { generateNasPaths } from "@/utils/nasPaths";
import type { User } from "@prisma/client";
import type { ProjectCardData, ShotItem } from "@/types";

function parseJsonArray(json?: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function normalizeHashtags(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((t) => `#${t}`)
    .join(" ");
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── WYSIWYG Markdown Editor (Notion/Obsidian-style) ────────
// Per-line contenteditable. Lines render formatted while raw markdown stays in state.

function renderInlineFormatted(text: string): string {
  if (!text) return "";
  const pattern = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\)|\*[^*\n]+\*)/g;
  let out = "";
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > cursor) out += escapeHtml(text.slice(cursor, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out += `<strong class="font-bold text-text-display">${escapeHtml(tok.slice(2, -2))}</strong>`;
    } else if (tok.startsWith("`")) {
      out += `<code class="border border-border-visible bg-surface px-1.5 py-0.5 text-text-display rounded-sm">${escapeHtml(tok.slice(1, -1))}</code>`;
    } else if (tok.startsWith("[")) {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      out += `<span class="text-text-display underline decoration-border-visible underline-offset-4">${escapeHtml(link?.[1] ?? "")}</span>`;
    } else {
      out += `<em class="italic text-text-primary">${escapeHtml(tok.slice(1, -1))}</em>`;
    }
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) out += escapeHtml(text.slice(cursor));
  return out;
}

type LineKind = "heading" | "bullet" | "numbered" | "quote" | "hr" | "code" | "para";

function getLineMeta(text: string): {
  kind: LineKind;
  level: number;
  marker: string;
  body: string;
} {
  if (!text.trim()) {
    return { kind: "para", level: 0, marker: "", body: "" };
  }
  const trimmed = text.trim();
  const hMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
  if (hMatch) {
    return { kind: "heading", level: hMatch[1].length, marker: hMatch[1] + " ", body: hMatch[2] };
  }
  if (/^[-*]\s+/.test(trimmed)) {
    return { kind: "bullet", level: 0, marker: trimmed.slice(0, 2), body: trimmed.replace(/^[-*]\s+/, "") };
  }
  const nMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
  if (nMatch) {
    return { kind: "numbered", level: 0, marker: nMatch[1] + " ", body: nMatch[2] };
  }
  if (/^>\s?/.test(trimmed)) {
    const marker = trimmed.match(/^>\s?/)?.[0] ?? "> ";
    return { kind: "quote", level: 0, marker, body: trimmed.replace(/^>\s?/, "") };
  }
  if (/^-{3,}$/.test(trimmed)) {
    return { kind: "hr", level: 0, marker: "", body: "" };
  }
  if (/^```/.test(trimmed)) {
    return { kind: "code", level: 0, marker: "", body: text };
  }
  return { kind: "para", level: 0, marker: "", body: text };
}

function lineWrapperClassName(kind: LineKind, level: number): string {
  const base =
    "outline-none focus:outline-none px-3 py-1 min-h-[1.75rem] whitespace-pre-wrap break-words leading-relaxed";

  if (kind === "heading") {
    if (level === 1) return `${base} text-2xl md:text-3xl font-bold text-text-display tracking-tight mt-2`;
    if (level === 2) return `${base} text-xl md:text-2xl font-bold text-text-display tracking-tight mt-2`;
    return `${base} text-lg font-bold text-text-display tracking-tight`;
  }
  if (kind === "bullet" || kind === "numbered") {
    if (kind === "bullet") {
      return `${base} relative text-text-primary pl-7 before:absolute before:left-2 before:text-text-secondary before:content-['•']`;
    }
    return `${base} text-text-primary pl-7`;
  }
  if (kind === "quote") {
    return `${base} text-text-secondary italic border-l-2 border-border-visible ml-1`;
  }
  if (kind === "hr") {
    return `${base} text-text-disabled flex items-center`;
  }
  if (kind === "code") {
    return `${base} text-text-secondary font-mono text-xs`;
  }
  return `${base} text-text-primary`;
}

function renderInactiveInner(text: string): string {
  const meta = getLineMeta(text);
  const empty = "<br>";
  if (meta.kind === "heading") {
    return renderInlineFormatted(meta.body) || empty;
  }
  if (meta.kind === "bullet") {
    return renderInlineFormatted(meta.body) || empty;
  }
  if (meta.kind === "numbered") {
    const trimmed = text.trim();
    const m = trimmed.match(/^(\d+\.)\s/);
    const marker = m?.[1] ?? "1.";
    return `<span class="absolute left-1 select-none text-text-secondary" contenteditable="false">${escapeHtml(marker)}</span>${renderInlineFormatted(meta.body) || empty}`;
  }
  if (meta.kind === "quote") {
    return `<span class="block pl-3">${renderInlineFormatted(meta.body) || empty}</span>`;
  }
  if (meta.kind === "hr") {
    return `<span class="block w-full border-t border-border-visible h-0"></span>`;
  }
  if (meta.kind === "code") {
    return escapeHtml(text);
  }
  if (!text) return empty;
  return renderInlineFormatted(text) || empty;
}

function renderActiveInner(text: string): string {
  return renderInactiveInner(text);
}

function getCaretOffsetWithin(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.endContainer)) return 0;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function getCaretOffsetFromPoint(el: HTMLElement, x: number, y: number): number {
  const doc = el.ownerDocument as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  let range: Range | null = null;

  if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(x, y);
  } else if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    if (position) {
      range = doc.createRange();
      range.setStart(position.offsetNode, position.offset);
    }
  }

  if (!range || !el.contains(range.startContainer)) {
    return rawOffsetToVisibleOffset(el.textContent ?? "", (el.textContent ?? "").length);
  }

  const preRange = range.cloneRange();
  preRange.selectNodeContents(el);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

function setCaretOffsetWithin(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let remaining = offset;
  let target: Text | null = null;
  let targetOffset = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    const len = n.textContent?.length ?? 0;
    if (remaining <= len) {
      target = n;
      targetOffset = remaining;
      break;
    }
    remaining -= len;
  }
  const range = document.createRange();
  if (target) {
    range.setStart(target, targetOffset);
  } else {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function getSelectionOffsetsWithin(el: HTMLElement): { start: number; end: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };

  const range = sel.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) return { start: 0, end: 0 };

  const startRange = range.cloneRange();
  startRange.selectNodeContents(el);
  startRange.setEnd(range.startContainer, range.startOffset);

  const endRange = range.cloneRange();
  endRange.selectNodeContents(el);
  endRange.setEnd(range.endContainer, range.endOffset);

  return {
    start: startRange.toString().length,
    end: endRange.toString().length,
  };
}

function getLineBodyStart(text: string): number {
  const heading = text.match(/^(#{1,3}\s+)/);
  if (heading) return heading[1].length;
  const bullet = text.match(/^[-*]\s+/);
  if (bullet) return bullet[0].length;
  const numbered = text.match(/^\d+\.\s+/);
  if (numbered) return numbered[0].length;
  const quote = text.match(/^>\s?/);
  if (quote) return quote[0].length;
  if (/^-{3,}$/.test(text.trim())) return text.length;
  return 0;
}

function buildInlineVisibleMap(text: string): number[] {
  const map: number[] = [0];
  const pattern = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\)|\*[^*\n]+\*)/g;
  let visibleLength = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;

  function appendPlain(start: number, end: number) {
    for (let raw = start; raw < end; raw += 1) {
      map[visibleLength] = raw;
      visibleLength += 1;
      map[visibleLength] = raw + 1;
    }
  }

  function appendToken(rawStart: number, bodyStart: number, body: string, rawEnd: number) {
    map[visibleLength] = bodyStart;
    for (let i = 0; i < body.length; i += 1) {
      visibleLength += 1;
      map[visibleLength] = bodyStart + i + 1;
    }
    map[visibleLength] = rawEnd;
  }

  while ((match = pattern.exec(text)) !== null) {
    appendPlain(cursor, match.index);

    const token = match[0];
    const rawStart = match.index;
    const rawEnd = pattern.lastIndex;
    if (token.startsWith("**")) {
      appendToken(rawStart, rawStart + 2, token.slice(2, -2), rawEnd);
    } else if (token.startsWith("`")) {
      appendToken(rawStart, rawStart + 1, token.slice(1, -1), rawEnd);
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      appendToken(rawStart, rawStart + 1, link?.[1] ?? "", rawEnd);
    } else {
      appendToken(rawStart, rawStart + 1, token.slice(1, -1), rawEnd);
    }

    cursor = rawEnd;
  }

  appendPlain(cursor, text.length);
  map[visibleLength] = text.length;
  return map;
}

function buildLineVisibleMap(text: string): number[] {
  if (/^-{3,}$/.test(text.trim())) return [text.length];
  const bodyStart = getLineBodyStart(text);
  const bodyMap = buildInlineVisibleMap(text.slice(bodyStart));
  return bodyMap.map((offset) => offset + bodyStart);
}

function visibleOffsetToRawOffset(text: string, visibleOffset: number): number {
  const map = buildLineVisibleMap(text);
  const clamped = Math.max(0, Math.min(visibleOffset, map.length - 1));
  return map[clamped] ?? text.length;
}

function rawOffsetToVisibleOffset(text: string, rawOffset: number): number {
  const map = buildLineVisibleMap(text);
  let visible = 0;
  for (let i = 0; i < map.length; i += 1) {
    if (map[i] <= rawOffset) visible = i;
    else break;
  }
  return visible;
}

function replaceRawRange(text: string, start: number, end: number, insert: string) {
  return `${text.slice(0, start)}${insert}${text.slice(end)}`;
}

type FocusHint = { idx: number; pos: "start" | "end" | number } | null;

function MarkdownLine({
  idx,
  text,
  active,
  focusHint,
  onActivate,
  onChange,
  onSplit,
  onMerge,
  onArrowUp,
  onArrowDown,
  onPasteMultiline,
  onConsumeFocusHint,
}: {
  idx: number;
  text: string;
  active: boolean;
  focusHint: FocusHint;
  onActivate: (idx: number, pos: "start" | "end" | number | null) => void;
  onChange: (idx: number, text: string, visibleCaret: number) => void;
  onSplit: (idx: number, before: string, after: string) => void;
  onMerge: (idx: number) => void;
  onArrowUp: (idx: number) => void;
  onArrowDown: (idx: number) => void;
  onPasteMultiline: (idx: number, segments: string[]) => void;
  onConsumeFocusHint: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(false);
  const meta = getLineMeta(text);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const justActivated = active && !wasActiveRef.current;
    const nextHtml = renderActiveInner(text);
    if (el.innerHTML !== nextHtml) {
      el.innerHTML = nextHtml;
    }

    if (active) {
      if (document.activeElement !== el) {
        el.focus({ preventScroll: false });
      }
      if (focusHint && focusHint.idx === idx) {
        if (focusHint.pos === "start") setCaretOffsetWithin(el, 0);
        else if (focusHint.pos === "end") {
          setCaretOffsetWithin(el, rawOffsetToVisibleOffset(text, text.length));
        } else if (typeof focusHint.pos === "number") setCaretOffsetWithin(el, focusHint.pos);
        onConsumeFocusHint();
      } else if (justActivated) {
        setCaretOffsetWithin(el, rawOffsetToVisibleOffset(text, text.length));
      }
    }

    wasActiveRef.current = active;
  }, [active, text, focusHint, idx, onConsumeFocusHint]);

  function handleBeforeInput(e: ReactFormEvent<HTMLDivElement>) {
    const inputEvent = e.nativeEvent as InputEvent;
    if (inputEvent.isComposing) return;

    const selection = getSelectionOffsetsWithin(e.currentTarget);
    const visibleStart = Math.min(selection.start, selection.end);
    const visibleEnd = Math.max(selection.start, selection.end);
    const rawStart = visibleOffsetToRawOffset(text, visibleStart);
    const rawEnd = visibleOffsetToRawOffset(text, visibleEnd);

    function commit(nextText: string, rawCaret: number) {
      onChange(idx, nextText, rawOffsetToVisibleOffset(nextText, rawCaret));
    }

    if (inputEvent.inputType === "insertText") {
      e.preventDefault();
      const insert = inputEvent.data ?? "";
      commit(replaceRawRange(text, rawStart, rawEnd, insert), rawStart + insert.length);
      return;
    }

    if (
      inputEvent.inputType === "insertParagraph" ||
      inputEvent.inputType === "insertLineBreak"
    ) {
      e.preventDefault();
      onSplit(idx, text.slice(0, rawStart), text.slice(rawEnd));
      return;
    }

    if (inputEvent.inputType === "deleteContentBackward") {
      e.preventDefault();
      if (visibleStart !== visibleEnd) {
        commit(replaceRawRange(text, rawStart, rawEnd, ""), rawStart);
        return;
      }
      if (visibleStart === 0) {
        if (idx > 0) onMerge(idx);
        return;
      }
      const prevRaw = visibleOffsetToRawOffset(text, visibleStart - 1);
      commit(replaceRawRange(text, prevRaw, rawStart, ""), prevRaw);
      return;
    }

    if (inputEvent.inputType === "deleteContentForward") {
      e.preventDefault();
      if (visibleStart !== visibleEnd) {
        commit(replaceRawRange(text, rawStart, rawEnd, ""), rawStart);
        return;
      }
      const lineEnd = rawOffsetToVisibleOffset(text, text.length);
      if (visibleStart >= lineEnd) return;
      const nextRaw = visibleOffsetToRawOffset(text, visibleStart + 1);
      commit(replaceRawRange(text, rawStart, nextRaw, ""), rawStart);
    }
  }

  function handleInput(e: ReactFormEvent<HTMLDivElement>) {
    // Fallback for browser paths that do not emit beforeinput.
    const raw = e.currentTarget.innerText.replace(/\n/g, "");
    onChange(idx, raw, rawOffsetToVisibleOffset(raw, raw.length));
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const visibleOffset = getCaretOffsetWithin(el);
    const rawOffset = visibleOffsetToRawOffset(text, visibleOffset);

    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSplit(idx, text.slice(0, rawOffset), text.slice(rawOffset));
      return;
    }

    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (visibleOffset === 0 && (!sel || sel.toString() === "") && idx > 0) {
        e.preventDefault();
        onMerge(idx);
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nextText = replaceRawRange(text, rawOffset, rawOffset, "  ");
      onChange(idx, nextText, rawOffsetToVisibleOffset(nextText, rawOffset + 2));
      return;
    }

    if (e.key === "ArrowUp" && !e.shiftKey) {
      e.preventDefault();
      onArrowUp(idx);
      return;
    }
    if (e.key === "ArrowDown" && !e.shiftKey) {
      e.preventDefault();
      onArrowDown(idx);
      return;
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const data = e.clipboardData.getData("text/plain");
    if (!data) return;
    e.preventDefault();

    const normalized = data.replace(/\r\n?/g, "\n");
    const segments = normalized.split("\n");
    const selection = getSelectionOffsetsWithin(e.currentTarget);
    const visibleStart = Math.min(selection.start, selection.end);
    const visibleEnd = Math.max(selection.start, selection.end);
    const rawStart = visibleOffsetToRawOffset(text, visibleStart);
    const rawEnd = visibleOffsetToRawOffset(text, visibleEnd);

    if (segments.length === 1) {
      const nextText = replaceRawRange(text, rawStart, rawEnd, segments[0]);
      onChange(
        idx,
        nextText,
        rawOffsetToVisibleOffset(nextText, rawStart + segments[0].length)
      );
      return;
    }

    const first = text.slice(0, rawStart) + segments[0];
    const last = segments[segments.length - 1] + text.slice(rawEnd);
    const middle = segments.slice(1, -1);
    onPasteMultiline(idx, [first, ...middle, last]);
  }

  function handleMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    if (active) return;
    const offset = getCaretOffsetFromPoint(e.currentTarget, e.clientX, e.clientY);
    e.preventDefault();
    onActivate(idx, offset);
  }

  return (
    <div
      ref={ref}
      role="textbox"
      id={idx === 0 ? "project-script" : undefined}
      aria-label={idx === 0 ? "Script & Notes Markdown editor" : undefined}
      data-line-idx={idx}
      contentEditable={active}
      suppressContentEditableWarning
      spellCheck={false}
      onMouseDown={handleMouseDown}
      onFocus={() => onActivate(idx, null)}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`${lineWrapperClassName(meta.kind, meta.level)} relative caret-text-display`}
    />
  );
}

function MarkdownLiveEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const lines = useMemo(() => (value === "" ? [""] : value.split("\n")), [value]);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [focusHint, setFocusHint] = useState<FocusHint>(null);
  const [guideMenu, setGuideMenu] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const consumeFocusHint = useCallback(() => {
    setFocusHint(null);
  }, []);

  const handleActivate = useCallback(
    (idx: number, pos: "start" | "end" | number | null) => {
      setActiveIdx((prev) => (prev === idx ? prev : idx));
      if (pos !== null) setFocusHint({ idx, pos });
    },
    []
  );

  const updateLine = useCallback(
    (idx: number, text: string, visibleCaret: number) => {
      const next = lines.slice();
      next[idx] = text;
      onChange(next.join("\n"));
      setActiveIdx(idx);
      setFocusHint({ idx, pos: visibleCaret });
    },
    [lines, onChange]
  );

  const splitLine = useCallback(
    (idx: number, before: string, after: string) => {
      const next = lines.slice();
      next[idx] = before;
      next.splice(idx + 1, 0, after);
      onChange(next.join("\n"));
      setActiveIdx(idx + 1);
      setFocusHint({ idx: idx + 1, pos: "start" });
    },
    [lines, onChange]
  );

  const mergeLine = useCallback(
    (idx: number) => {
      if (idx === 0) return;
      const next = lines.slice();
      const prevRawLength = next[idx - 1].length;
      next[idx - 1] = next[idx - 1] + next[idx];
      next.splice(idx, 1);
      onChange(next.join("\n"));
      setActiveIdx(idx - 1);
      setFocusHint({
        idx: idx - 1,
        pos: rawOffsetToVisibleOffset(next[idx - 1], prevRawLength),
      });
    },
    [lines, onChange]
  );

  const arrowUp = useCallback(
    (idx: number) => {
      if (idx === 0) return;
      const prevIdx = idx - 1;
      setActiveIdx(prevIdx);
      setFocusHint({
        idx: prevIdx,
        pos: rawOffsetToVisibleOffset(lines[prevIdx] ?? "", lines[prevIdx]?.length ?? 0),
      });
    },
    [lines]
  );

  const arrowDown = useCallback(
    (idx: number) => {
      const nextIdx = idx + 1;
      if (nextIdx >= lines.length) return;
      setActiveIdx(nextIdx);
      setFocusHint({
        idx: nextIdx,
        pos: rawOffsetToVisibleOffset(lines[nextIdx] ?? "", lines[nextIdx]?.length ?? 0),
      });
    },
    [lines]
  );

  const pasteMultiline = useCallback(
    (idx: number, segments: string[]) => {
      if (segments.length === 0) return;
      const next = lines.slice();
      next.splice(idx, 1, ...segments);
      onChange(next.join("\n"));
      const last = idx + segments.length - 1;
      setActiveIdx(last);
      setFocusHint({
        idx: last,
        pos: rawOffsetToVisibleOffset(segments[segments.length - 1], segments[segments.length - 1].length),
      });
    },
    [lines, onChange]
  );

  function handleContainerBlur(e: FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (!next || !containerRef.current?.contains(next)) {
      setActiveIdx(-1);
    }
  }

  function handleContainerClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      const lastIdx = lines.length - 1;
      handleActivate(lastIdx, "end");
    }
  }

  function handleContextMenu(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setGuideMenu({ x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (!guideMenu) return;
    function closeGuide() {
      setGuideMenu(null);
    }
    window.addEventListener("click", closeGuide);
    window.addEventListener("keydown", closeGuide);
    return () => {
      window.removeEventListener("click", closeGuide);
      window.removeEventListener("keydown", closeGuide);
    };
  }, [guideMenu]);

  const isEmpty = lines.length === 1 && lines[0] === "";

  return (
    <div
      ref={containerRef}
      className="relative min-h-[420px] cursor-text py-1 font-mono text-sm leading-relaxed"
      onBlur={handleContainerBlur}
      onClick={handleContainerClick}
      onContextMenu={handleContextMenu}
    >
      {isEmpty && activeIdx === -1 && (
        <div className="pointer-events-none absolute left-3 top-2 z-10 text-text-disabled">
          // Initialize script sequence...
        </div>
      )}
      {lines.map((line, idx) => (
        <MarkdownLine
          key={idx}
          idx={idx}
          text={line}
          active={idx === activeIdx}
          focusHint={focusHint}
          onActivate={handleActivate}
          onChange={updateLine}
          onSplit={splitLine}
          onMerge={mergeLine}
          onArrowUp={arrowUp}
          onArrowDown={arrowDown}
          onPasteMultiline={pasteMultiline}
          onConsumeFocusHint={consumeFocusHint}
        />
      ))}
      {guideMenu && (
        <div
          className="fixed z-[150] w-64 border border-border-visible bg-background p-3 font-mono text-[11px] leading-relaxed text-text-secondary"
          style={{ left: guideMenu.x, top: guideMenu.y }}
          role="menu"
        >
          <div className="mb-2 text-text-display tracking-widest uppercase">
            [ Markdown Menu ]
          </div>
          <div># Heading</div>
          <div>## Subheading</div>
          <div>**bold** / *italic*</div>
          <div>`inline code`</div>
          <div>- bullet</div>
          <div>&gt; quote</div>
        </div>
      )}
    </div>
  );
}

function formatPublishDate(d?: Date | string | null): string {
  if (!d) return "Unscheduled";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "Unscheduled";
  return dt
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

interface ProjectDetailsModalProps {
  project: ProjectCardData | null; // null = create mode
  onClose: () => void;
  onCreated: () => void;
  onProjectUpdate?: (updatedProject: Partial<ProjectCardData> & { id: string }) => void;
}

function parseShotItems(json?: string): ShotItem[] {
  try {
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

// Custom chevron for `<select>` fields (native arrow hidden via `appearance-none`).
function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-0 bottom-2 w-3 h-3 text-text-secondary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function toDateInputValue(d?: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ProjectDetailsModal({
  project,
  onClose,
  onCreated,
  onProjectUpdate,
}: ProjectDetailsModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<User[]>([]);

  const isEditing = !!project;

  // Form state
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<string>("Organic");
  const [format, setFormat] = useState<string>("Short_Form");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [briefingNotes, setBriefingNotes] = useState("");

  // Shot lists (local state from JSON)
  const [aRollShots, setARollShots] = useState<ShotItem[]>([]);
  const [bRollShots, setBRollShots] = useState<ShotItem[]>([]);

  // Shot input drafts
  const [aRollDraft, setARollDraft] = useState("");
  const [bRollDraft, setBRollDraft] = useState("");
  const [localScript, setLocalScript] = useState("");
  const [scriptSaveStatus, setScriptSaveStatus] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const lastSavedScriptRef = useRef("");
  const scriptSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scriptSaveSeqRef = useRef(0);

  // Interactive metadata state
  const [dueDate, setDueDate] = useState("");
  const [editorId, setEditorId] = useState("");
  const [cameramanId, setCameramanId] = useState("");
  const [talentId, setTalentId] = useState("");

  // Asset Management state
  const [reviewLink, setReviewLink] = useState("");
  const [detectedOS, setDetectedOS] = useState<"mac" | "win" | "unknown">("unknown");

  // Ideation metadata
  const [productLinks, setProductLinks] = useState("");

  // Platform API IDs (Published post-publish edit)
  const [youtubeId, setYoutubeId] = useState("");
  const [metaId, setMetaId] = useState("");
  const [tiktokId, setTiktokId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [isEditingRaw, setIsEditingRaw] = useState(!project?.folderName);
  const [tempFolderName, setTempFolderName] = useState(project?.folderName || "");
  const [isSavingIds, startSaveIds] = useTransition();

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) {
      setDetectedOS("mac");
      return;
    }
    if (ua.includes("win")) {
      setDetectedOS("win");
      return;
    }
    setDetectedOS("unknown");
  }, []);

  useEffect(() => {
    if (scriptSaveTimerRef.current) {
      clearTimeout(scriptSaveTimerRef.current);
      scriptSaveTimerRef.current = null;
    }
    scriptSaveSeqRef.current += 1;

    if (project) {
      const script = project.script || "";
      setTitle(project.title);
      setContentType(project.contentType);
      setFormat(project.format);
      setPlatforms(parsePlatforms(project.platformsTargeted));
      setBriefingNotes(project.briefingNotes || "");
      setLocalScript(script);
      lastSavedScriptRef.current = script;
      setScriptSaveStatus("saved");
      setARollShots(parseShotItems(project.aRollShots));
      setBRollShots(parseShotItems(project.bRollShots));
      setDueDate(toDateInputValue(project.dueDate));
      setEditorId(project.assignedEditor?.id || project.assignedEditorId || "");
      setCameramanId(project.assignedCameraman?.id || project.assignedCameramanId || "");
      setTalentId(project.assignedTalent?.id || project.assignedTalentId || "");
      setReviewLink(project.reviewLink || "");
      setProductLinks(project.productLinks || "");
      setYoutubeId(project.youtubeId || "");
      setMetaId(project.metaId || "");
      setTiktokId(project.tiktokId || "");
      setFolderName(project.folderName || "");
      setTempFolderName(project.folderName || "");
      setIsEditingRaw(!project.folderName);
    } else {
      setTitle("");
      setContentType("Organic");
      setFormat("Short_Form");
      setPlatforms([]);
      setBriefingNotes("");
      setLocalScript("");
      lastSavedScriptRef.current = "";
      setScriptSaveStatus("idle");
      setARollShots([]);
      setBRollShots([]);
      setDueDate("");
      setEditorId("");
      setCameramanId("");
      setTalentId("");
      setReviewLink("");
      setProductLinks("");
      setYoutubeId("");
      setMetaId("");
      setTiktokId("");
      setFolderName("");
      setTempFolderName("");
      setIsEditingRaw(true);
    }
    setARollDraft("");
    setBRollDraft("");
  }, [project]);

  useEffect(() => {
    if (!project) return;

    if (scriptSaveTimerRef.current) {
      clearTimeout(scriptSaveTimerRef.current);
      scriptSaveTimerRef.current = null;
    }

    if (localScript === lastSavedScriptRef.current) {
      setScriptSaveStatus((prev) => (prev === "saving" ? prev : "saved"));
      return;
    }

    setScriptSaveStatus("dirty");
    const saveSeq = ++scriptSaveSeqRef.current;
    const projectId = project.id;
    const content = localScript;

    scriptSaveTimerRef.current = setTimeout(async () => {
      setScriptSaveStatus("saving");
      const result = await updateProjectScript(projectId, content);
      if (saveSeq !== scriptSaveSeqRef.current) return;

      if (!result.success) {
        setScriptSaveStatus("error");
        showToast(result.error, "error");
        return;
      }

      lastSavedScriptRef.current = content;
      setScriptSaveStatus("saved");
      onProjectUpdate?.({ id: projectId, script: content });
    }, 900);

    return () => {
      if (scriptSaveTimerRef.current) {
        clearTimeout(scriptSaveTimerRef.current);
        scriptSaveTimerRef.current = null;
      }
    };
  }, [localScript, project?.id]);

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleShot(list: "a" | "b", shotId: string) {
    if (!project) return;
    const setter = list === "a" ? setARollShots : setBRollShots;
    const current = list === "a" ? aRollShots : bRollShots;
    const next = current.map((s) =>
      s.id === shotId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setter(next);
    const serialized = JSON.stringify(next);
    onProjectUpdate?.({
      id: project.id,
      ...(list === "a" ? { aRollShots: serialized } : { bRollShots: serialized }),
    });
    startTransition(async () => {
      const result = await updateProjectShotlist(
        project.id,
        list === "a" ? "aRoll" : "bRoll",
        next
      );
      if (!result.success) {
        setter(current);
        const revertSerialized = JSON.stringify(current);
        onProjectUpdate?.({
          id: project.id,
          ...(list === "a"
            ? { aRollShots: revertSerialized }
            : { bRollShots: revertSerialized }),
        });
        showToast(result.error, "error");
      }
    });
  }

  function saveMetadata(patch: {
    dueDate?: string | null;
    assignedEditorId?: string | null;
    assignedCameramanId?: string | null;
    assignedTalentId?: string | null;
    productLinks?: string | null;
  }) {
    if (!project) return;
    startTransition(async () => {
      const result = await updateProjectMetadata(project.id, patch);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      const parentPatch: Partial<ProjectCardData> & { id: string } = {
        id: project.id,
      };
      if (patch.dueDate !== undefined) {
        parentPatch.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
      }
      if (patch.assignedEditorId !== undefined) {
        parentPatch.assignedEditorId = patch.assignedEditorId;
        parentPatch.assignedEditor = patch.assignedEditorId
          ? users.find((u) => u.id === patch.assignedEditorId) ?? null
          : null;
      }
      if (patch.assignedCameramanId !== undefined) {
        parentPatch.assignedCameramanId = patch.assignedCameramanId;
        parentPatch.assignedCameraman = patch.assignedCameramanId
          ? users.find((u) => u.id === patch.assignedCameramanId) ?? null
          : null;
      }
      if (patch.assignedTalentId !== undefined) {
        parentPatch.assignedTalentId = patch.assignedTalentId;
        parentPatch.assignedTalent = patch.assignedTalentId
          ? users.find((u) => u.id === patch.assignedTalentId) ?? null
          : null;
      }
      if (patch.productLinks !== undefined) {
        parentPatch.productLinks = patch.productLinks;
      }
      onProjectUpdate?.(parentPatch);
    });
  }

  function saveAssets(patch: { reviewLink?: string }) {
    if (!project) return;
    const normalized: { reviewLink?: string | null } = {};
    if (patch.reviewLink !== undefined) {
      const trimmed = patch.reviewLink.trim();
      if (trimmed === (project.reviewLink || "")) return;
      normalized.reviewLink = trimmed || null;
    }
    if (Object.keys(normalized).length === 0) return;
    startTransition(async () => {
      const result = await updateProjectAssets(project.id, normalized);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      onProjectUpdate?.({ id: project.id, ...normalized });
    });
  }

  function saveRawFolderName() {
    if (!project) return;
    const nextFolderName = tempFolderName.trim();
    startSaveIds(async () => {
      const result = await updatePlatformIds(project.id, {
        folderName: nextFolderName,
      });
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      setFolderName(nextFolderName);
      onProjectUpdate?.({
        id: project.id,
        folderName: nextFolderName || null,
      });
      setIsEditingRaw(!nextFolderName);
      showToast("NAS folder updated.", "success");
    });
  }

  function savePlatformIds(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    const nextYoutube = youtubeId.trim();
    const nextMeta = metaId.trim();
    const nextTiktok = tiktokId.trim();
    startSaveIds(async () => {
      const result = await updatePlatformIds(project.id, {
        youtubeId: nextYoutube,
        metaId: nextMeta,
        tiktokId: nextTiktok,
      });
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      onProjectUpdate?.({
        id: project.id,
        youtubeId: nextYoutube || null,
        metaId: nextMeta || null,
        tiktokId: nextTiktok || null,
      });
      showToast("Project details updated.", "success");
    });
  }

  function handlePlatformToggle(platform: string) {
    if (!project) return;
    const prevPlatforms = [...platforms];
    const nextPlatforms = prevPlatforms.includes(platform)
      ? prevPlatforms.filter((p) => p !== platform)
      : [...prevPlatforms, platform];

    setPlatforms(nextPlatforms);
    onProjectUpdate?.({
      id: project.id,
      platformsTargeted: JSON.stringify(nextPlatforms),
    });

    startTransition(async () => {
      const result = await toggleProjectPlatform(project.id, platform);
      if (!result.success) {
        setPlatforms(prevPlatforms);
        onProjectUpdate?.({
          id: project.id,
          platformsTargeted: JSON.stringify(prevPlatforms),
        });
        showToast(result.error, "error");
      }
    });
  }

  function handleStageSelect(stage: string) {
    if (!project || stage === project.status) return;
    const prevStatus = project.status;
    const prevPublishDate = project.publishDate ?? null;

    onProjectUpdate?.({
      id: project.id,
      status: stage,
      ...(stage === "Published" && { publishDate: new Date() }),
    });
    startTransition(async () => {
      const result = await updateProjectStatusDirect(project.id, stage);
      if (!result.success) {
        onProjectUpdate?.({
          id: project.id,
          status: prevStatus,
          publishDate: prevPublishDate,
        });
        showToast(result.error, "error");
      }
    });
  }

  function deleteShot(list: "a" | "b", shotId: string) {
    if (!project) return;
    const setter = list === "a" ? setARollShots : setBRollShots;
    const current = list === "a" ? aRollShots : bRollShots;
    const next = current.filter((s) => s.id !== shotId);
    setter(next);
    const serialized = JSON.stringify(next);
    onProjectUpdate?.({
      id: project.id,
      ...(list === "a" ? { aRollShots: serialized } : { bRollShots: serialized }),
    });
    startTransition(async () => {
      const result = await updateProjectShotlist(
        project.id,
        list === "a" ? "aRoll" : "bRoll",
        next
      );
      if (!result.success) {
        setter(current);
        const revertSerialized = JSON.stringify(current);
        onProjectUpdate?.({
          id: project.id,
          ...(list === "a"
            ? { aRollShots: revertSerialized }
            : { bRollShots: revertSerialized }),
        });
        showToast(result.error, "error");
      }
    });
  }

  function addShot(list: "a" | "b") {
    if (!project) return;
    const draft = list === "a" ? aRollDraft : bRollDraft;
    const text = draft.trim();
    if (!text) return;
    const setter = list === "a" ? setARollShots : setBRollShots;
    const draftSetter = list === "a" ? setARollDraft : setBRollDraft;
    const current = list === "a" ? aRollShots : bRollShots;
    const newShot: ShotItem = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
    };
    const next = [...current, newShot];
    setter(next);
    draftSetter("");
    const serialized = JSON.stringify(next);
    onProjectUpdate?.({
      id: project.id,
      ...(list === "a" ? { aRollShots: serialized } : { bRollShots: serialized }),
    });
    startTransition(async () => {
      const result = await updateProjectShotlist(
        project.id,
        list === "a" ? "aRoll" : "bRoll",
        next
      );
      if (!result.success) {
        setter(current);
        const revertSerialized = JSON.stringify(current);
        onProjectUpdate?.({
          id: project.id,
          ...(list === "a"
            ? { aRollShots: revertSerialized }
            : { bRollShots: revertSerialized }),
        });
        showToast(result.error, "error");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Project title is required.", "error");
      return;
    }
    startTransition(async () => {
      const result = await createProject({
        title,
        contentType,
        format,
        platformsTargeted: platforms,
        briefingNotes: contentType === "Sponsored" ? briefingNotes : undefined,
      });
      if (result.success) {
        showToast("Project created.", "success");
        onCreated();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard.", "success");
  }

  // Compute completion %
  const allShots = [...aRollShots, ...bRollShots];
  const completedShots = allShots.filter((s) => s.isCompleted).length;
  const completionPct = allShots.length > 0 ? Math.round((completedShots / allShots.length) * 100) : 0;
  const currentFolderName = isEditing ? folderName.trim() || project.folderName || "" : "";
  const nasPaths = isEditing && currentFolderName
    ? generateNasPaths(currentFolderName, project.status, project.publishDate)
    : null;
  const rawPath = detectedOS === "mac" ? nasPaths?.macPath : detectedOS === "win" ? nasPaths?.winPath : "";
  const osBadge = detectedOS === "mac" ? "[  ]" : detectedOS === "win" ? "[ ⊞ ]" : "[ ? ]";
  const scriptStatusLabel =
    scriptSaveStatus === "dirty"
      ? "[ AUTOSAVE QUEUED ]"
      : scriptSaveStatus === "saving"
        ? "[ AUTOSAVING... ]"
        : scriptSaveStatus === "error"
          ? "[ AUTOSAVE FAILED ]"
          : scriptSaveStatus === "saved"
            ? "[ SAVED ]"
            : "[ AUTOSAVE ]";

  // Determine status color
  const statusColors: Record<string, string> = {
    Ideation: "bg-interactive",
    Scripting: "bg-interactive",
    Filming: "bg-warning",
    Editing: "bg-warning",
    Review: "bg-success",
    Published: "bg-success",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 ui-modal-backdrop" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-5xl ui-panel flex flex-col md:max-h-[90vh]">

        {/* ─── HEADER ─── */}
        <div className="flex justify-between items-start p-4 md:p-6 border-b border-border-visible shrink-0">
          <div className="flex-1 min-w-0">
            {isEditing && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className={cn("w-2 h-2 rounded-full", statusColors[project.status] || "bg-text-disabled")} />
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                  ID: {project.id.slice(0, 8)}
                </span>
                <span className="border border-border-visible text-text-secondary px-2 py-1 text-[10px] font-mono uppercase">
                  {project.status}
                </span>
                <span className="border border-border-visible text-text-secondary px-2 py-1 text-[10px] font-mono uppercase">
                  {project.contentType.replace("_", " ")}
                </span>
                <span className="border border-border-visible text-text-secondary px-2 py-1 text-[10px] font-mono uppercase">
                  {project.format.replace("_", " ")}
                </span>
              </div>
            )}
            <input
              className="text-xl md:text-2xl font-bold text-text-display bg-transparent outline-none uppercase w-full placeholder:text-text-disabled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="PROJECT TITLE"
              readOnly={isEditing}
            />
          </div>

          <div className="flex flex-col items-end ml-4 shrink-0">
            <button onClick={onClose} className="text-text-secondary hover:text-text-display font-mono text-xs mb-2 transition-colors">
              [ X ]
            </button>
            {isEditing && (
              <div className="text-right">
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block">Completion</span>
                <div className="text-3xl font-mono text-text-display tracking-widest">{completionPct}%</div>
              </div>
            )}
          </div>
        </div>

        {/* ─── TWO-COLUMN BODY ─── */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

          {/* ═══ LEFT COLUMN — Assets & Tasks ═══ */}
          <div className="flex-none md:flex-1 overflow-visible md:overflow-y-auto p-4 md:p-6 md:border-r border-border-visible">

            {/* CREATE MODE — form fields */}
            {!isEditing && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Content Type */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Content Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {CONTENT_TYPES.map((ct) => (
                      <button key={ct} type="button" onClick={() => setContentType(ct)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                        contentType === ct ? "border border-text-display text-text-display bg-transparent" : "border border-border-visible text-text-secondary bg-transparent hover:border-outline-variant"
                      )}>{ct.replace("_", " ")}</button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Format</label>
                  <div className="flex gap-2 flex-wrap">
                    {FORMATS.map((f) => (
                      <button key={f} type="button" onClick={() => setFormat(f)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                        format === f ? "border border-text-display text-text-display bg-transparent" : "border border-border-visible text-text-secondary bg-transparent hover:border-outline-variant"
                      )}>{f.replace("_", " ")}</button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Platforms</label>
                  <div className="flex gap-2 flex-wrap">
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                        platforms.includes(p) ? "border border-text-display text-text-display bg-transparent" : "border border-border-visible text-text-secondary bg-transparent hover:border-outline-variant"
                      )}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Briefing Notes */}
                {contentType === "Sponsored" && (
                  <div>
                    <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                      Briefing Notes<span className="text-accent ml-1">*</span>
                    </label>
                    <textarea
                      value={briefingNotes}
                      onChange={(e) => setBriefingNotes(e.target.value)}
                      placeholder="Client requirements, talking points, deliverables..."
                      className="w-full ui-textarea p-3 text-sm min-h-[100px] resize-y"
                    />
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border-visible">
                  <button type="button" onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-secondary border border-border-visible hover:border-outline-variant transition-colors">
                    CANCEL
                  </button>
                  <button type="submit" disabled={isPending} className={cn(
                    "px-6 py-1.5 text-[10px] font-mono uppercase tracking-widest bg-text-display text-text-inverse hover:opacity-80 transition-colors",
                    isPending && "opacity-50 cursor-wait"
                  )}>
                    {isPending ? "CREATING..." : "CREATE PROJECT"}
                  </button>
                </div>
              </form>
            )}

            {/* EDIT MODE — Asset Management + Shot Lists */}
            {isEditing && (
              <div className="flex flex-col gap-8">

                {/* ── EXPORT ASSETS (Published only) ── */}
                {project.status === "Published" && (() => {
                  const caption = project.baseCaption?.trim() || "";
                  const hashtagLine = normalizeHashtags(project.hashtags);
                  const tiktokCopy = [caption, hashtagLine].filter(Boolean).join(" ").trim();
                  const abTitlesList = parseJsonArray(project.abTitles);
                  const thumbnailsList = parseJsonArray(project.thumbnails);
                  return (
                    <div className="border border-border-visible bg-surface p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                          Export Assets
                        </h3>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block">
                            Scheduled
                          </span>
                          <span className="text-sm font-mono text-text-display tracking-widest">
                            {formatPublishDate(project.publishedAt ?? project.publishDate)}
                          </span>
                        </div>
                      </div>

                      {/* Short-Form export blocks */}
                      {project.format === "Short_Form" && (
                        <div className="flex flex-col gap-3">
                          <CopyBlock
                            label="TIKTOK / REELS"
                            copyValue={tiktokCopy || "—"}
                          >
                            {tiktokCopy || (
                              <span className="text-text-disabled italic">
                                No caption or hashtags captured.
                              </span>
                            )}
                          </CopyBlock>
                          <CopyBlock
                            label="YT SHORTS"
                            copyValue={caption || "—"}
                          >
                            {caption || (
                              <span className="text-text-disabled italic">
                                No caption captured.
                              </span>
                            )}
                          </CopyBlock>
                        </div>
                      )}

                      {/* Long-Form export blocks */}
                      {project.format === "Long_Form" && (
                        <div className="flex flex-col gap-3">
                          <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                            A/B Titles
                          </div>
                          <div className="flex flex-col gap-2">
                            {abTitlesList.length > 0 ? (
                              abTitlesList.map((title, i) => (
                                <CopyBlock
                                  key={`ab-${i}`}
                                  label={`TITLE ${i + 1}`}
                                  copyValue={title}
                                />
                              ))
                            ) : (
                              <div className="bg-surface border border-border-visible p-4 text-xs font-mono text-text-disabled italic">
                                No A/B titles captured.
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-2">
                            Thumbnails
                          </div>
                          {thumbnailsList.length > 0 ? (
                            <ul className="flex flex-col gap-1 bg-surface border border-border-visible p-4">
                              {thumbnailsList.map((t, i) => (
                                <li
                                  key={`thumb-${i}`}
                                  className="text-xs font-mono text-text-primary break-all"
                                >
                                  <span className="text-text-disabled mr-2">{i + 1}.</span>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="bg-surface border border-border-visible p-4 text-xs font-mono text-text-disabled italic">
                              No thumbnails captured.
                            </div>
                          )}
                        </div>
                      )}

                      {project.format !== "Short_Form" && project.format !== "Long_Form" && (
                        <div className="text-xs font-mono text-text-disabled italic">
                          No export template for format: {project.format.replace("_", " ")}.
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── PLATFORM API IDs (Published only) ── */}
                {project.status === "Published" && (
                  <form
                    onSubmit={savePlatformIds}
                    className="border border-border-visible bg-surface p-4 flex flex-col"
                  >
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">
                      Platform API IDs
                    </h3>

                    <label
                      htmlFor="platform-youtube"
                      className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2 block"
                    >
                      YouTube Video ID
                    </label>
                    <input
                      id="platform-youtube"
                      type="text"
                      autoComplete="off"
                      value={youtubeId}
                      onChange={(e) => setYoutubeId(e.target.value)}
                      placeholder="dQw4w9WgXcQ"
                      className="w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display transition-colors mb-4"
                    />

                    <label
                      htmlFor="platform-meta"
                      className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2 block"
                    >
                      Meta Reel ID
                    </label>
                    <input
                      id="platform-meta"
                      type="text"
                      autoComplete="off"
                      value={metaId}
                      onChange={(e) => setMetaId(e.target.value)}
                      placeholder="17841400000000000"
                      className="w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display transition-colors mb-4"
                    />

                    <label
                      htmlFor="platform-tiktok"
                      className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2 block"
                    >
                      TikTok Video ID
                    </label>
                    <input
                      id="platform-tiktok"
                      type="text"
                      autoComplete="off"
                      value={tiktokId}
                      onChange={(e) => setTiktokId(e.target.value)}
                      placeholder="7234567890123456789"
                      className="w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display transition-colors mb-4"
                    />

                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={isSavingIds}
                        className={cn(
                          "px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-border-visible text-text-secondary hover:text-text-display hover:border-text-display transition-colors",
                          isSavingIds && "opacity-50 cursor-wait"
                        )}
                      >
                        {isSavingIds ? "[ UPDATING... ]" : "[ UPDATE IDS ]"}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Rejection Feedback Alert ── */}
                {project.reviewFeedback && (
                  <div className="bg-accent-subtle border border-accent/40 p-4 mb-6 rounded-sm">
                    <h3 className="text-xs font-bold text-accent uppercase font-mono">REVISION REQUIRED</h3>
                    <p className="text-sm text-accent/80 mt-2 whitespace-pre-wrap">{project.reviewFeedback}</p>
                  </div>
                )}

                {/* ── Asset Management ── */}
                <div className="hidden md:block">
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Asset Management</label>

                  {/* Raw Storage Path */}
                  <div className="bg-surface border border-border-visible flex min-h-10 items-stretch mb-2">
                    <span className="w-20 flex items-center text-[10px] font-mono text-text-secondary uppercase tracking-widest px-3 shrink-0 border-r border-border-visible">
                      RAW
                    </span>
                    {isEditingRaw ? (
                      <input
                        type="text"
                        value={tempFolderName}
                        onChange={(e) => setTempFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveRawFolderName();
                          }
                        }}
                        placeholder="Enter NAS folder name and press Enter..."
                        className="flex-1 min-w-0 bg-transparent text-xs font-mono text-text-primary px-3 py-2.5 outline-none placeholder:text-text-disabled"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 bg-transparent">
                        <span className="text-[10px] font-mono text-text-disabled shrink-0">
                          {osBadge}
                        </span>
                        <span className={cn(
                          "text-xs font-mono truncate",
                          rawPath ? "text-text-primary" : "text-text-disabled"
                        )}>
                          {rawPath || "Set Folder Name to generate path..."}
                        </span>
                      </div>
                    )}
                    {!isEditingRaw && (
                      <div className="flex shrink-0 border-l border-border-visible">
                        <button
                          type="button"
                          onClick={() => {
                            setTempFolderName(folderName);
                            setIsEditingRaw(true);
                          }}
                          className="text-[10px] font-mono text-text-secondary hover:text-text-display px-3 py-2.5 transition-colors"
                        >
                          [ EDIT ]
                        </button>
                        {rawPath && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rawPath)}
                            className="text-[10px] font-mono text-text-secondary hover:text-text-display px-3 py-2.5 border-l border-border-visible transition-colors"
                          >
                            [ COPY ]
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nextcloud Link */}
                  <div className="bg-surface border border-border-visible flex min-h-10 items-stretch">
                    <span className="w-20 flex items-center text-[10px] font-mono text-text-secondary uppercase tracking-widest px-3 shrink-0 border-r border-border-visible">
                      PREVIEW
                    </span>
                    <input
                      type="text"
                      value={reviewLink}
                      onChange={(e) => setReviewLink(e.target.value)}
                      onBlur={() => saveAssets({ reviewLink })}
                      placeholder="https://nc.studio.local/s/..."
                      className="flex-1 min-w-0 bg-transparent text-xs font-mono text-text-primary px-3 py-2.5 outline-none placeholder:text-text-disabled"
                    />
                    {reviewLink && (
                      <a
                        href={reviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-text-display px-3 py-2.5 border-l border-border-visible transition-colors shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Briefing Notes (Sponsored) ── */}
                {project.contentType === "Sponsored" && project.briefingNotes && (
                  <div>
                    <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                      Briefing Notes
                    </label>
                    <div className="bg-surface border border-border-visible p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap">
                      {project.briefingNotes}
                    </div>
                  </div>
                )}

                {/* ── Task Progress — Shot Lists ── */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Task Progress</label>
                  <div className="grid grid-cols-2 gap-6">

                    {/* A-ROLL */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", project.aRollComplete ? "bg-success" : "bg-warning")} />
                          A-ROLL
                        </span>
                        <span className="text-[10px] font-mono text-text-disabled">
                          {aRollShots.filter(s => s.isCompleted).length}/{aRollShots.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {aRollShots.length > 0 ? aRollShots.map((shot) => (
                          <ShotRow
                            key={shot.id}
                            shot={shot}
                            onToggle={(id) => toggleShot("a", id)}
                            onDelete={(id) => deleteShot("a", id)}
                          />
                        )) : (
                          <span className="text-[10px] font-mono text-text-disabled italic px-2">No shots defined</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="+ Add shot..."
                        value={aRollDraft}
                        onChange={(e) => setARollDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addShot("a");
                          }
                        }}
                        className="w-full bg-surface border border-border-visible text-text-primary font-mono text-xs p-2 focus:outline-none focus:border-text-display/50 transition-colors mt-2"
                      />
                    </div>

                    {/* B-ROLL */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", project.bRollComplete ? "bg-success" : "bg-warning")} />
                          B-ROLL
                        </span>
                        <span className="text-[10px] font-mono text-text-disabled">
                          {bRollShots.filter(s => s.isCompleted).length}/{bRollShots.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {bRollShots.length > 0 ? bRollShots.map((shot) => (
                          <ShotRow
                            key={shot.id}
                            shot={shot}
                            onToggle={(id) => toggleShot("b", id)}
                            onDelete={(id) => deleteShot("b", id)}
                          />
                        )) : (
                          <span className="text-[10px] font-mono text-text-disabled italic px-2">No shots defined</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="+ Add shot..."
                        value={bRollDraft}
                        onChange={(e) => setBRollDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addShot("b");
                          }
                        }}
                        className="w-full bg-surface border border-border-visible text-text-primary font-mono text-xs p-2 focus:outline-none focus:border-text-display/50 transition-colors mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Script Editor ── */}
                <div className="pt-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase">
                      Script & Notes
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono tracking-widest uppercase",
                        scriptSaveStatus === "error"
                          ? "text-error"
                          : scriptSaveStatus === "saving" || scriptSaveStatus === "dirty"
                            ? "text-warning"
                            : "text-text-disabled"
                      )}
                    >
                      {scriptStatusLabel}
                    </span>
                  </div>
                  <MarkdownLiveEditor
                    value={localScript}
                    onChange={setLocalScript}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN — Metadata Sidebar ═══ */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 overflow-visible md:overflow-y-auto p-4 md:p-5 lg:p-6 bg-surface border-t md:border-t-0 border-border-visible">

            {/* ── Metadata ── */}
            <div className="flex flex-col">
              {/* Created By */}
              <div className="mb-6">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  Created By
                </label>
                <span className="text-xs font-bold text-text-display uppercase tracking-wider block truncate">
                  {isEditing && project.creator ? project.creator.name : "—"}
                </span>
              </div>

              {/* Client / Brand (Sponsored only) */}
              {isEditing && project.contentType === "Sponsored" && (
                <div className="mb-6">
                  <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                    Client / Brand
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      project.briefingNotes?.split("\n")[0]?.replace(/^Client:\s*/i, "") ||
                      ""
                    }
                    placeholder="—"
                    className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display transition-colors whitespace-nowrap overflow-x-auto"
                  />
                </div>
              )}

              {/* Due Date */}
              <div className="mb-6">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  Due Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDueDate(value);
                      saveMetadata({ dueDate: value || null });
                    }}
                    className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display transition-colors color-scheme-dark"
                    style={{ colorScheme: "dark" }}
                  />
                ) : (
                  <span className="text-xs font-bold text-text-display uppercase tracking-wider block">
                    Not set
                  </span>
                )}
              </div>

              {/* Lead Editor */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  Lead Editor
                </label>
                {isEditing ? (
                  <>
                    <select
                      value={editorId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditorId(value);
                        saveMetadata({ assignedEditorId: value || null });
                      }}
                      className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display transition-colors appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-surface">Unassigned</option>
                      {users.map((u) => (
                          <option key={u.id} value={u.id} className="bg-surface">
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown />
                  </>
                ) : (
                  <span className="text-xs font-bold text-text-disabled uppercase tracking-wider block">
                    Auto-assigned
                  </span>
                )}
              </div>

              {/* Cameraman */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  Cameraman
                </label>
                {isEditing ? (
                  <>
                    <select
                      value={cameramanId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCameramanId(value);
                        saveMetadata({ assignedCameramanId: value || null });
                      }}
                      className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display transition-colors appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-surface">Unassigned</option>
                      {users.map((u) => (
                          <option key={u.id} value={u.id} className="bg-surface">
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown />
                  </>
                ) : (
                  <span className="text-xs font-bold text-text-display uppercase tracking-wider block">—</span>
                )}
              </div>

              {/* A-Roll Talent */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  A-Roll Talent
                </label>
                {isEditing ? (
                  <>
                    <select
                      value={talentId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTalentId(value);
                        saveMetadata({ assignedTalentId: value || null });
                      }}
                      className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display transition-colors appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-surface">Unassigned</option>
                      {users.map((u) => (
                          <option key={u.id} value={u.id} className="bg-surface">
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown />
                  </>
                ) : (
                  <span className="text-xs font-bold text-text-display uppercase tracking-wider block">—</span>
                )}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-border-visible my-4" />

            {/* ── Product / Affiliate Links (Ideation planning) ── */}
            {isEditing && (
              <div className="mb-6">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  Product / Affiliate Links
                </label>
                <textarea
                  value={productLinks}
                  onChange={(e) => setProductLinks(e.target.value)}
                  onBlur={() => {
                    const next = productLinks.trim();
                    if (next === (project.productLinks?.trim() || "")) return;
                    saveMetadata({ productLinks: next });
                  }}
                  placeholder={`Keychron K2 — https://...\nElgato Key Light — https://...`}
                  className="w-full bg-surface border border-border-visible p-3 text-xs font-mono text-text-primary uppercase focus:outline-none focus:border-text-display transition-colors min-h-[80px] resize-y mt-1"
                />
              </div>
            )}

            {/* ── Divider ── */}
            {isEditing && <div className="border-t border-border-visible my-4" />}

            {/* ── Platforms ── */}
            <div>
              <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-3">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => (isEditing ? handlePlatformToggle(p) : togglePlatform(p))}
                    disabled={isPending}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50",
                      platforms.includes(p)
                        ? "border border-text-display text-text-display"
                        : "border border-border-visible text-text-disabled hover:border-outline-variant hover:text-text-primary"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-border-visible my-4" />

            {/* ── Status Timeline ── */}
            {isEditing && (
              <div>
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-3">Pipeline Stage</label>
                <div className="flex flex-col gap-1">
                  {["Ideation", "Scripting", "Filming", "Editing", "Review", "Published"].map((stage) => {
                    const stageIndex = ["Ideation", "Scripting", "Filming", "Editing", "Review", "Published"].indexOf(stage);
                    const currentIndex = ["Ideation", "Scripting", "Filming", "Editing", "Review", "Published"].indexOf(project.status);
                    const isPast = stageIndex < currentIndex;
                    const isCurrent = stage === project.status;

                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => handleStageSelect(stage)}
                        disabled={isPending || isCurrent}
                        className={cn(
                          "group flex items-center gap-2 py-1 w-full text-left transition-colors disabled:cursor-default",
                          !isCurrent && "cursor-pointer"
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          isCurrent ? statusColors[stage] || "bg-white" : isPast ? "bg-text-secondary" : "bg-surface-raised"
                        )} />
                        <span className={cn(
                          "text-[10px] font-mono uppercase tracking-widest transition-colors",
                          isCurrent ? "text-text-display" : isPast ? "text-text-secondary group-hover:text-text-display" : "text-text-disabled group-hover:text-text-display"
                        )}>
                          {stage}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-text-secondary ml-auto">←</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
