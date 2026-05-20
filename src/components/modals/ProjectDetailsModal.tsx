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
import { flushSync } from "react-dom";
import {
  createProject,
  getUsers,
  updateProjectMetadata,
  updateProjectShotlist,
  updateProjectAssets,
  updatePlatformIds,
  updateProjectStatusDirect,
  toggleProjectPlatform,
  scanForDraft,
} from "@/actions/projects";
import { getSponsorshipDeals } from "@/actions/sponsorships";
import { getNasConfig, getProjectFormSettings } from "@/actions/settings";
import { updateProjectScript } from "@/app/actions";
import { useToast } from "@/components/ui/Toast";
import { useLocale, useT } from "@/lib/i18n/client";
import { toIntlLocale, type Locale } from "@/lib/i18n/locales";
import { FORMATS, getPlatformsForFormat } from "@/lib/constants";
import {
  DEFAULT_CONTENT_TYPE_OPTIONS,
  getContentTypeLabel,
  type ContentTypeOption,
} from "@/lib/appSettingsConfig";
import { formatCurrencyAmount } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { parsePlatforms } from "@/lib/utils";
import ShotRow from "@/components/kanban/ShotRow";
import CopyBlock from "@/components/ui/CopyBlock";
import { generateNasPaths, type NasConfig } from "@/utils/nasPaths";
import type { ProjectCardData, ProjectUser, ShotItem } from "@/types";

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
// Per-block contenteditable. Blocks render formatted while raw markdown stays in state.

const INLINE_MARKDOWN_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\)|\*[^*\n]+\*)/g;
const SOFT_BREAK_MARKER = "  \n";
const CARET_HOLDER = "\u200B";

function canPreviewInlineToken(text: string, rawEnd: number): boolean {
  return rawEnd === text.length || /\s/.test(text[rawEnd]);
}

function textWithVisibleSoftBreaks(text: string): string {
  return text.replaceAll(SOFT_BREAK_MARKER, "\n");
}

function renderVisibleText(text: string): string {
  const parts = text.split(SOFT_BREAK_MARKER);
  return parts.reduce((html, part, index) => {
    const escaped = escapeHtml(part);
    if (index === 0) return escaped;
    const filler = part === "" ? CARET_HOLDER : "";
    return `${html}\n${filler}${escaped}`;
  }, "");
}

function getActiveBlockPreview(
  text: string
): { bodyStart: number; level: number; kind: "heading" | "bullet" | "quote" } | null {
  const match = text.match(/^(#{1,3})\s+([\s\S]*)$/);
  if (match) return { bodyStart: match[1].length + 1, level: match[1].length, kind: "heading" };

  const bullet = text.match(/^[-*]\s+([\s\S]*)$/);
  if (bullet) return { bodyStart: 2, level: 0, kind: "bullet" };

  const quote = text.match(/^>\s?/);
  if (quote) return { bodyStart: quote[0].length, level: 0, kind: "quote" };

  return null;
}

function getActivePreviewSource(text: string): { source: string; bodyStart: number } {
  const block = getActiveBlockPreview(text);
  if (!block) return { source: text, bodyStart: 0 };
  return { source: text.slice(block.bodyStart), bodyStart: block.bodyStart };
}

function getRenderedLineStartRawOffset(text: string): number {
  return getActiveBlockPreview(text)?.bodyStart ?? 0;
}

function hasActivePreview(text: string): boolean {
  const { source } = getActivePreviewSource(text);
  return Boolean(getActiveBlockPreview(text)) || hasActiveInlinePreview(source);
}

function activeLineClassName(text: string): string {
  const block = getActiveBlockPreview(text);
  if (!block) {
    return "outline-none focus:outline-none px-3 py-1 min-h-[1.75rem] whitespace-pre-wrap break-words leading-relaxed text-text-primary";
  }
  return lineWrapperClassName(block.kind, block.level);
}

function renderInlineFormatted(text: string): string {
  if (!text) return "";
  let out = "";
  let cursor = 0;
  let m: RegExpExecArray | null;
  const pattern = new RegExp(INLINE_MARKDOWN_PATTERN.source, "g");
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > cursor) out += renderVisibleText(text.slice(cursor, m.index));
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
  if (cursor < text.length) out += renderVisibleText(text.slice(cursor));
  return out;
}

function renderInlineActivePreview(text: string): string {
  if (!text) return "";
  let out = "";
  let cursor = 0;
  let m: RegExpExecArray | null;
  const pattern = new RegExp(INLINE_MARKDOWN_PATTERN.source, "g");

  while ((m = pattern.exec(text)) !== null) {
    const rawEnd = pattern.lastIndex;
    if (!canPreviewInlineToken(text, rawEnd)) continue;

    if (m.index > cursor) out += renderVisibleText(text.slice(cursor, m.index));
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
    cursor = rawEnd;
  }

  if (cursor < text.length) out += renderVisibleText(text.slice(cursor));
  return out;
}

function hasActiveInlinePreview(text: string): boolean {
  const pattern = new RegExp(INLINE_MARKDOWN_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (canPreviewInlineToken(text, pattern.lastIndex)) return true;
  }
  return false;
}

function getActivePreviewText(text: string): string {
  if (!hasActivePreview(text)) return text;
  const { source } = getActivePreviewSource(text);
  if (!hasActiveInlinePreview(source)) return textWithVisibleSoftBreaks(source);
  let out = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(INLINE_MARKDOWN_PATTERN.source, "g");

  while ((match = pattern.exec(source)) !== null) {
    const token = match[0];
    const rawEnd = pattern.lastIndex;
    if (!canPreviewInlineToken(source, rawEnd)) continue;

    out += textWithVisibleSoftBreaks(source.slice(cursor, match.index));
    if (token.startsWith("**")) out += token.slice(2, -2);
    else if (token.startsWith("`")) out += token.slice(1, -1);
    else if (token.startsWith("[")) out += token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)?.[1] ?? "";
    else out += token.slice(1, -1);
    cursor = rawEnd;
  }

  return out + textWithVisibleSoftBreaks(source.slice(cursor));
}

function reconcileActivePreviewInput(text: string, visibleText: string): {
  nextText: string;
  rawCaret: number;
} {
  const previousVisible = getActivePreviewText(text);
  let start = 0;

  while (
    start < previousVisible.length &&
    start < visibleText.length &&
    previousVisible[start] === visibleText[start]
  ) {
    start += 1;
  }

  let previousEnd = previousVisible.length;
  let nextEnd = visibleText.length;
  while (
    previousEnd > start &&
    nextEnd > start &&
    previousVisible[previousEnd - 1] === visibleText[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  const rawStart = activeVisibleOffsetToRawOffset(text, start);
  const rawEnd = activeVisibleOffsetToRawOffset(text, previousEnd);
  const insert = visibleText.slice(start, nextEnd).replace(/\n/g, SOFT_BREAK_MARKER);

  return {
    nextText: replaceRawRange(text, rawStart, rawEnd, insert),
    rawCaret: rawStart + insert.length,
  };
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
  const hMatch = trimmed.match(/^(#{1,3})\s+([\s\S]*)$/);
  if (hMatch) {
    return { kind: "heading", level: hMatch[1].length, marker: hMatch[1] + " ", body: hMatch[2] };
  }
  if (/^[-*]\s+/.test(trimmed)) {
    return { kind: "bullet", level: 0, marker: trimmed.slice(0, 2), body: trimmed.replace(/^[-*]\s+/, "") };
  }
  const nMatch = trimmed.match(/^(\d+\.)\s+([\s\S]*)$/);
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
  if (!text) return "<br>";
  const { source } = getActivePreviewSource(text);
  const html = hasActiveInlinePreview(source) ? renderInlineActivePreview(source) : renderVisibleText(source);
  return html || "<br>";
}

function getCaretOffsetWithin(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.endContainer)) return 0;
  return getVisibleOffsetForPoint(el, range.endContainer, range.endOffset);
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
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (isSoftBreakFillerNode(node)) return NodeFilter.FILTER_REJECT;
        if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        if (isSoftBreakNode(node)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      },
    }
  );
  let remaining = offset;
  let target: Text | null = null;
  let targetOffset = 0;
  let targetElement: Element | null = null;
  let placeAfterElement = false;

  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (isSoftBreakNode(n)) {
      if (remaining <= 1) {
        targetElement = n;
        placeAfterElement = remaining === 1;
        break;
      }
      remaining -= 1;
      continue;
    }

    const textNode = n as Text;
    const text = textNode.textContent ?? "";
    const len = getVisibleTextLength(text);
    if (remaining <= len) {
      target = textNode;
      targetOffset = getTextOffsetForVisibleOffset(text, remaining);
      break;
    }
    remaining -= len;
  }
  const range = document.createRange();
  if (target) {
    range.setStart(target, targetOffset);
  } else if (targetElement) {
    if (placeAfterElement) range.setStartAfter(targetElement);
    else range.setStartBefore(targetElement);
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

  return {
    start: getVisibleOffsetForPoint(el, range.startContainer, range.startOffset),
    end: getVisibleOffsetForPoint(el, range.endContainer, range.endOffset),
  };
}

function isSoftBreakNode(node: Node): node is HTMLBRElement {
  return node instanceof HTMLBRElement && node.dataset.softBreak === "true";
}

function isSoftBreakFillerNode(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && node.dataset.softBreakFiller === "true";
}

function getNodeVisibleLength(node: Node): number {
  if (isSoftBreakFillerNode(node)) return 0;
  if (node.nodeType === Node.TEXT_NODE) return getVisibleTextLength(node.textContent ?? "");
  if (isSoftBreakNode(node)) return 1;
  let length = 0;
  node.childNodes.forEach((child) => {
    length += getNodeVisibleLength(child);
  });
  return length;
}

function getVisibleOffsetForPoint(root: HTMLElement, container: Node, offset: number): number {
  let visibleOffset = 0;
  let found = false;

  function walk(node: Node) {
    if (found) return;

    if (node === container) {
      if (node.nodeType === Node.TEXT_NODE) {
        visibleOffset += getVisibleOffsetForTextOffset(node.textContent ?? "", offset);
      } else {
        const children = Array.from(node.childNodes).slice(0, offset);
        children.forEach((child) => {
          visibleOffset += getNodeVisibleLength(child);
        });
      }
      found = true;
      return;
    }

    if (node.nodeType === Node.TEXT_NODE || isSoftBreakNode(node)) {
      visibleOffset += getNodeVisibleLength(node);
      return;
    }

    node.childNodes.forEach(walk);
  }

  walk(root);
  return visibleOffset;
}

function getVisibleTextLength(text: string): number {
  return text.replaceAll(CARET_HOLDER, "").length;
}

function getVisibleOffsetForTextOffset(text: string, textOffset: number): number {
  let visibleOffset = 0;
  for (let i = 0; i < Math.min(textOffset, text.length); i += 1) {
    if (text[i] !== CARET_HOLDER) visibleOffset += 1;
  }
  return visibleOffset;
}

function getTextOffsetForVisibleOffset(text: string, visibleOffset: number): number {
  let visible = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (visible === visibleOffset) return i;
    if (text[i] !== CARET_HOLDER) visible += 1;
  }
  return text.length;
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
  let visibleLength = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(INLINE_MARKDOWN_PATTERN.source, "g");

  function appendPlain(start: number, end: number) {
    let raw = start;
    while (raw < end) {
      if (text.startsWith(SOFT_BREAK_MARKER, raw) && raw + SOFT_BREAK_MARKER.length <= end) {
        map[visibleLength] = raw;
        visibleLength += 1;
        map[visibleLength] = raw + SOFT_BREAK_MARKER.length;
        raw += SOFT_BREAK_MARKER.length;
        continue;
      }
      map[visibleLength] = raw;
      visibleLength += 1;
      map[visibleLength] = raw + 1;
      raw += 1;
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

function buildActivePreviewMap(text: string): number[] {
  const { bodyStart } = getActivePreviewSource(text);
  const map: number[] = [bodyStart];
  let visibleLength = 0;
  let cursor = bodyStart;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(INLINE_MARKDOWN_PATTERN.source, "g");

  function appendPlain(start: number, end: number) {
    let raw = start;
    while (raw < end) {
      if (text.startsWith(SOFT_BREAK_MARKER, raw) && raw + SOFT_BREAK_MARKER.length <= end) {
        map[visibleLength] = raw;
        visibleLength += 1;
        map[visibleLength] = raw + SOFT_BREAK_MARKER.length;
        raw += SOFT_BREAK_MARKER.length;
        continue;
      }
      map[visibleLength] = raw;
      visibleLength += 1;
      map[visibleLength] = raw + 1;
      raw += 1;
    }
  }

  function appendPreview(rawStart: number, bodyStart: number, body: string, rawEnd: number) {
    map[visibleLength] = rawStart;
    for (let i = 0; i < body.length; i += 1) {
      visibleLength += 1;
      map[visibleLength] = bodyStart + i + 1;
    }
    map[visibleLength] = rawEnd;
  }

  while ((match = pattern.exec(text)) !== null) {
    const token = match[0];
    const rawStart = match.index;
    const rawEnd = pattern.lastIndex;
    if (rawStart < bodyStart || !canPreviewInlineToken(text, rawEnd)) continue;

    appendPlain(cursor, rawStart);

    if (token.startsWith("**")) {
      appendPreview(rawStart, rawStart + 2, token.slice(2, -2), rawEnd);
    } else if (token.startsWith("`")) {
      appendPreview(rawStart, rawStart + 1, token.slice(1, -1), rawEnd);
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      appendPreview(rawStart, rawStart + 1, link?.[1] ?? "", rawEnd);
    } else {
      appendPreview(rawStart, rawStart + 1, token.slice(1, -1), rawEnd);
    }

    cursor = rawEnd;
  }

  appendPlain(cursor, text.length);
  map[visibleLength] = text.length;
  return map;
}

function activeVisibleOffsetToRawOffset(text: string, visibleOffset: number): number {
  if (!hasActivePreview(text)) return visibleOffset;
  const map = buildActivePreviewMap(text);
  const clamped = Math.max(0, Math.min(visibleOffset, map.length - 1));
  return map[clamped] ?? text.length;
}

function rawOffsetToActiveVisibleOffset(text: string, rawOffset: number): number {
  if (!hasActivePreview(text)) return rawOffset;
  const map = buildActivePreviewMap(text);
  let visible = 0;
  for (let i = 0; i < map.length; i += 1) {
    if (map[i] <= rawOffset) visible = i;
    else break;
  }
  return visible;
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

type FocusPosition = "start" | "end" | number;
type FocusHint = { idx: number; pos: FocusPosition } | null;
type SplitMode = "plain" | "continue";

function getLineContinuationPrefix(text: string): string {
  const bullet = text.match(/^([-*])\s+([\s\S]+)$/);
  if (bullet?.[2].trim()) return `${bullet[1]} `;

  const quote = text.match(/^(>\s?)([\s\S]+)$/);
  if (quote?.[2].trim()) return "> ";

  return "";
}

function shouldClearEmptyContinuation(text: string): boolean {
  return /^[-*]\s*$/.test(text) || /^>\s*$/.test(text);
}

function splitMarkdownBlocks(value: string): string[] {
  if (value === "") return [""];

  const rawLines = value.split("\n");
  const blocks: string[] = [];
  let current = "";

  rawLines.forEach((line, index) => {
    current = index === 0 || current === "" ? `${current}${line}` : `${current}\n${line}`;

    if (index < rawLines.length - 1 && !line.endsWith("  ")) {
      blocks.push(current);
      current = "";
    }
  });

  blocks.push(current);
  return blocks;
}

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
  onChange: (idx: number, text: string, rawCaret: number) => void;
  onSplit: (idx: number, before: string, after: string, mode?: SplitMode) => void;
  onMerge: (idx: number, fromRawOffset?: number) => void;
  onArrowUp: (idx: number) => void;
  onArrowDown: (idx: number) => void;
  onPasteMultiline: (idx: number, segments: string[]) => void;
  onConsumeFocusHint: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wasActiveRef = useRef(false);
  const skipNextInputRef = useRef(false);
  const meta = getLineMeta(text);
  const t = useT();
  const className = active ? activeLineClassName(text) : lineWrapperClassName(meta.kind, meta.level);
  const rendersActivePreview = active && hasActivePreview(text);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const justActivated = active && !wasActiveRef.current;
    const nextHtml = active ? renderActiveInner(text) : renderInactiveInner(text);
    const htmlChanged = el.innerHTML !== nextHtml;
    const previousVisibleCaret =
      htmlChanged && active && document.activeElement === el
        ? getCaretOffsetWithin(el)
        : null;

    if (htmlChanged) {
      el.innerHTML = nextHtml;
    }

    if (active) {
      if (document.activeElement !== el) {
        el.focus({ preventScroll: false });
      }
      if (focusHint && focusHint.idx === idx) {
        if (focusHint.pos === "start") setCaretOffsetWithin(el, 0);
        else if (focusHint.pos === "end") {
          setCaretOffsetWithin(el, rawOffsetToActiveVisibleOffset(text, text.length));
        } else if (typeof focusHint.pos === "number") {
          setCaretOffsetWithin(el, rawOffsetToActiveVisibleOffset(text, focusHint.pos));
        }
        onConsumeFocusHint();
      } else if (justActivated) {
        setCaretOffsetWithin(el, rawOffsetToActiveVisibleOffset(text, text.length));
      } else if (htmlChanged && previousVisibleCaret !== null) {
        const maxVisible = rawOffsetToActiveVisibleOffset(text, text.length);
        setCaretOffsetWithin(el, Math.min(previousVisibleCaret, maxVisible));
      }
    }

    wasActiveRef.current = active;
  }, [active, text, focusHint, idx, onConsumeFocusHint]);

  function handleBeforeInput(e: ReactFormEvent<HTMLDivElement>) {
    const inputEvent = e.nativeEvent as InputEvent;
    if (inputEvent.isComposing) return;

    const selection = getSelectionOffsetsWithin(e.currentTarget);
    const selectionStart = rendersActivePreview
      ? activeVisibleOffsetToRawOffset(text, selection.start)
      : selection.start;
    const selectionEnd = rendersActivePreview
      ? activeVisibleOffsetToRawOffset(text, selection.end)
      : selection.end;
    const rawStart = Math.min(selectionStart, selectionEnd);
    const rawEnd = Math.max(selectionStart, selectionEnd);
    const renderedLineStart = getRenderedLineStartRawOffset(text);

    function commit(nextText: string, rawCaret: number) {
      onChange(idx, nextText, rawCaret);
    }

    if (inputEvent.inputType === "insertText") {
      e.preventDefault();
      skipNextInputRef.current = true;
      const insert = inputEvent.data ?? "";
      flushSync(() =>
        commit(replaceRawRange(text, rawStart, rawEnd, insert), rawStart + insert.length)
      );
      return;
    }

    if (
      inputEvent.inputType === "insertParagraph" ||
      inputEvent.inputType === "insertLineBreak"
    ) {
      e.preventDefault();
      skipNextInputRef.current = true;
      if (inputEvent.inputType === "insertLineBreak") {
        flushSync(() =>
          commit(
            replaceRawRange(text, rawStart, rawEnd, SOFT_BREAK_MARKER),
            rawStart + SOFT_BREAK_MARKER.length
          )
        );
        return;
      }
      flushSync(() =>
        onSplit(
          idx,
          text.slice(0, rawStart),
          text.slice(rawEnd),
          "continue"
        )
      );
      return;
    }

    if (inputEvent.inputType === "deleteContentBackward") {
      e.preventDefault();
      skipNextInputRef.current = true;
      if (rawStart !== rawEnd) {
        flushSync(() => commit(replaceRawRange(text, rawStart, rawEnd, ""), rawStart));
        return;
      }
      if (rawStart === renderedLineStart) {
        if (idx > 0) flushSync(() => onMerge(idx, renderedLineStart));
        else if (renderedLineStart > 0) flushSync(() => commit(text.slice(renderedLineStart), 0));
        return;
      }
      const prevRaw = rawStart - 1;
      flushSync(() => commit(replaceRawRange(text, prevRaw, rawStart, ""), prevRaw));
      return;
    }

    if (inputEvent.inputType === "deleteContentForward") {
      e.preventDefault();
      skipNextInputRef.current = true;
      if (rawStart !== rawEnd) {
        flushSync(() => commit(replaceRawRange(text, rawStart, rawEnd, ""), rawStart));
        return;
      }
      if (rawStart >= text.length) return;
      const nextRaw = rawStart + 1;
      flushSync(() => commit(replaceRawRange(text, rawStart, nextRaw, ""), rawStart));
    }
  }

  function handleInput(e: ReactFormEvent<HTMLDivElement>) {
    // Fallback for browser paths that do not emit beforeinput.
    if (skipNextInputRef.current) {
      skipNextInputRef.current = false;
      return;
    }
    const raw = e.currentTarget.innerText.replaceAll(CARET_HOLDER, "").replace(/\n$/, "");
    if (rendersActivePreview) {
      const reconciled = reconcileActivePreviewInput(text, raw);
      onChange(idx, reconciled.nextText, reconciled.rawCaret);
      return;
    }
    onChange(idx, raw, raw.length);
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const visibleOffset = getCaretOffsetWithin(el);
    const rawOffset = rendersActivePreview
      ? activeVisibleOffsetToRawOffset(text, visibleOffset)
      : visibleOffset;
    const renderedLineStart = getRenderedLineStartRawOffset(text);

    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      skipNextInputRef.current = true;
      if (e.shiftKey) {
        flushSync(() =>
          onChange(
            idx,
            replaceRawRange(text, rawOffset, rawOffset, SOFT_BREAK_MARKER),
            rawOffset + SOFT_BREAK_MARKER.length
          )
        );
        return;
      }
      flushSync(() =>
        onSplit(
          idx,
          text.slice(0, rawOffset),
          text.slice(rawOffset),
          "continue"
        )
      );
      return;
    }

    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (
        rawOffset === renderedLineStart &&
        (!sel || sel.toString() === "") &&
        idx > 0
      ) {
        e.preventDefault();
        onMerge(idx, renderedLineStart);
        return;
      }
      if (
        rawOffset === renderedLineStart &&
        (!sel || sel.toString() === "") &&
        renderedLineStart > 0
      ) {
        e.preventDefault();
        onChange(idx, text.slice(renderedLineStart), 0);
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nextText = replaceRawRange(text, rawOffset, rawOffset, "  ");
      onChange(idx, nextText, rawOffset + 2);
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
    const selectionStart = rendersActivePreview
      ? activeVisibleOffsetToRawOffset(text, selection.start)
      : selection.start;
    const selectionEnd = rendersActivePreview
      ? activeVisibleOffsetToRawOffset(text, selection.end)
      : selection.end;
    const rawStart = Math.min(selectionStart, selectionEnd);
    const rawEnd = Math.max(selectionStart, selectionEnd);

    if (segments.length === 1) {
      const nextText = replaceRawRange(text, rawStart, rawEnd, segments[0]);
      onChange(idx, nextText, rawStart + segments[0].length);
      return;
    }

    const first = text.slice(0, rawStart) + segments[0];
    const last = segments[segments.length - 1] + text.slice(rawEnd);
    const middle = segments.slice(1, -1);
    onPasteMultiline(idx, [first, ...middle, last]);
  }

  function handleMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    if (active) return;
    const visibleOffset = getCaretOffsetFromPoint(e.currentTarget, e.clientX, e.clientY);
    const offset = visibleOffsetToRawOffset(text, visibleOffset);
    e.preventDefault();
    onActivate(idx, offset);
  }

  return (
    <div
      ref={ref}
      role="textbox"
      id={idx === 0 ? "project-script" : undefined}
      aria-label={idx === 0 ? t("projectModal.scriptNotesEditor") : undefined}
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
      className={`${className} relative caret-text-display`}
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
  const lines = useMemo(() => splitMarkdownBlocks(value), [value]);
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
    (idx: number, text: string, rawCaret: number) => {
      const next = lines.slice();
      next[idx] = text;
      onChange(next.join("\n"));
      setActiveIdx(idx);
      setFocusHint({ idx, pos: rawCaret });
    },
    [lines, onChange]
  );

  const splitLine = useCallback(
    (idx: number, before: string, after: string, mode: SplitMode = "plain") => {
      const next = lines.slice();
      let currentLine = before;
      let nextLine = after;
      let nextPos: FocusPosition = "start";

      if (mode === "continue") {
        const prefix = getLineContinuationPrefix(before);
        if (prefix) {
          nextLine = `${prefix}${after}`;
          nextPos = prefix.length;
        } else if (!after && shouldClearEmptyContinuation(before)) {
          next[idx] = "";
          onChange(next.join("\n"));
          setActiveIdx(idx);
          setFocusHint({ idx, pos: "start" });
          return;
        }
      }

      next[idx] = currentLine;
      next.splice(idx + 1, 0, nextLine);
      onChange(next.join("\n"));
      setActiveIdx(idx + 1);
      setFocusHint({ idx: idx + 1, pos: nextPos });
    },
    [lines, onChange]
  );

  const mergeLine = useCallback(
    (idx: number, fromRawOffset = 0) => {
      if (idx === 0) return;
      const next = lines.slice();
      const prevRawLength = next[idx - 1].length;
      next[idx - 1] = next[idx - 1] + next[idx].slice(fromRawOffset);
      next.splice(idx, 1);
      onChange(next.join("\n"));
      setActiveIdx(idx - 1);
      setFocusHint({
        idx: idx - 1,
        pos: prevRawLength,
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
        pos: lines[prevIdx]?.length ?? 0,
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
        pos: lines[nextIdx]?.length ?? 0,
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
        pos: segments[segments.length - 1].length,
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

function formatPublishDate(d: Date | string | null | undefined, locale: Locale): string {
  if (!d) return "Unscheduled";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "Unscheduled";
  return dt
    .toLocaleDateString(toIntlLocale(locale), {
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

type SponsorshipDealOption = Awaited<ReturnType<typeof getSponsorshipDeals>>[number];

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

function todayInputValue(): string {
  return toDateInputValue(new Date());
}

function formatDealDate(d: Date | string | null | undefined, locale: Locale): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt
    .toLocaleDateString(toIntlLocale(locale), { year: "numeric", month: "short", day: "2-digit" })
    .toUpperCase();
}

function formatDealMoney(value?: number | null, currency?: string | null): string {
  if (!value) return "—";
  return formatCurrencyAmount(value, currency || "VND");
}

export default function ProjectDetailsModal({
  project,
  onClose,
  onCreated,
  onProjectUpdate,
}: ProjectDetailsModalProps) {
  const { showToast } = useToast();
  const t = useT();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [sponsorshipDeals, setSponsorshipDeals] = useState<SponsorshipDealOption[]>([]);
  const [contentTypeOptions, setContentTypeOptions] = useState<ContentTypeOption[]>(
    DEFAULT_CONTENT_TYPE_OPTIONS
  );

  const isEditing = !!project;

  // Form state
  const [title, setTitle] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [contentType, setContentType] = useState<string>("Organic");
  const [format, setFormat] = useState<string>("Short_Form");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [briefingNotes, setBriefingNotes] = useState("");
  const [sponsorshipId, setSponsorshipId] = useState("");

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
  const loadedProjectIdRef = useRef<string | null>(null);

  // Interactive metadata state
  const [scriptingDueDate, setScriptingDueDate] = useState("");
  const [filmingDueDate, setFilmingDueDate] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const minDeadlineDate = todayInputValue();
  const [editorId, setEditorId] = useState("");
  const [cameramanId, setCameramanId] = useState("");
  const [talentId, setTalentId] = useState("");

  // Asset Management state
  const [reviewLink, setReviewLink] = useState("");
  const [isScanningDraft, setIsScanningDraft] = useState(false);
  const [detectedOS, setDetectedOS] = useState<"mac" | "win" | "unknown">("unknown");
  const [nasConfig, setNasConfig] = useState<NasConfig | null>(null);

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
  const visiblePlatforms = useMemo(
    () => Array.from(getPlatformsForFormat(format)),
    [format]
  );

  useEffect(() => {
    getUsers().then(setUsers);
    getSponsorshipDeals()
      .then(setSponsorshipDeals)
      .catch((error) => {
        console.error("[ProjectDetailsModal:getSponsorshipDeals]", error);
      });
    getNasConfig()
      .then(setNasConfig)
      .catch((error) => {
        console.error("[ProjectDetailsModal:getNasConfig]", error);
      });
    getProjectFormSettings()
      .then((settings) => setContentTypeOptions(settings.contentTypes))
      .catch((error) => {
        console.error("[ProjectDetailsModal:getProjectFormSettings]", error);
      });
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
    const projectId = project?.id ?? null;
    if (loadedProjectIdRef.current === projectId) return;
    loadedProjectIdRef.current = projectId;

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
      setSponsorshipId(project.sponsorshipId || project.sponsorship?.id || "");
      setLocalScript(script);
      lastSavedScriptRef.current = script;
      setScriptSaveStatus("saved");
      setARollShots(parseShotItems(project.aRollShots));
      setBRollShots(parseShotItems(project.bRollShots));
      setScriptingDueDate(toDateInputValue(project.scriptingDueDate));
      setFilmingDueDate(toDateInputValue(project.filmingDueDate));
      setEditingDueDate(toDateInputValue(project.editingDueDate));
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
      setSponsorshipId("");
      setLocalScript("");
      lastSavedScriptRef.current = "";
      setScriptSaveStatus("idle");
      setARollShots([]);
      setBRollShots([]);
      setScriptingDueDate("");
      setFilmingDueDate("");
      setEditingDueDate("");
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
    if (project) return;
    if (contentTypeOptions.some((option) => option.value === contentType)) return;
    setContentType(contentTypeOptions[0]?.value ?? "Organic");
  }, [contentType, contentTypeOptions, project]);

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

  function handleFormatSelect(nextFormat: string) {
    setFormat(nextFormat);
    const allowed = new Set<string>(getPlatformsForFormat(nextFormat));
    setPlatforms((prev) => prev.filter((platform) => allowed.has(platform)));
  }

  function handleContentTypeSelect(nextContentType: string) {
    setContentType(nextContentType);
    if (nextContentType !== "Sponsored") {
      setSponsorshipId("");
      setBriefingNotes("");
      setProductLinks("");
    }
  }

  function handleSponsorshipSelect(nextId: string) {
    setSponsorshipId(nextId);
    const deal = sponsorshipDeals.find((item) => item.id === nextId);
    setBriefingNotes(deal?.notes || "");
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
    scriptingDueDate?: string | null;
    filmingDueDate?: string | null;
    editingDueDate?: string | null;
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
      if (patch.scriptingDueDate !== undefined) {
        parentPatch.scriptingDueDate = patch.scriptingDueDate
          ? new Date(patch.scriptingDueDate)
          : null;
      }
      if (patch.filmingDueDate !== undefined) {
        parentPatch.filmingDueDate = patch.filmingDueDate
          ? new Date(patch.filmingDueDate)
          : null;
      }
      if (patch.editingDueDate !== undefined) {
        parentPatch.editingDueDate = patch.editingDueDate
          ? new Date(patch.editingDueDate)
          : null;
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

  async function handleScanForDrafts() {
    if (!project || isScanningDraft) return;

    setIsScanningDraft(true);
    try {
      const result = await scanForDraft(project.id, project.title);

      if (!result.success) {
        showToast(result.error, "warning");
        return;
      }

      setReviewLink(result.link);
      onProjectUpdate?.({ id: project.id, reviewLink: result.link, draftVersion: result.version });
      showToast(t("projectModal.draftReviewDetected"), "success");
    } finally {
      setIsScanningDraft(false);
    }
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
      showToast(t("projectModal.nasFolderUpdated"), "success");
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
      showToast(t("projectModal.detailsUpdated"), "success");
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
    const prevReviewLink = project.reviewLink ?? null;
    const prevDraftVersion = project.draftVersion;
    const prevReviewFeedback = project.reviewFeedback ?? null;
    const isDraftRejection = prevStatus === "Review" && stage === "Editing";

    if (isDraftRejection) {
      setReviewLink("");
    }
    onProjectUpdate?.({
      id: project.id,
      status: stage,
      ...(stage === "Published" && { publishDate: new Date() }),
      ...(isDraftRejection && {
        reviewFeedback: null,
        reviewLink: null,
        draftVersion: project.draftVersion + 1,
      }),
    });
    startTransition(async () => {
      const result = await updateProjectStatusDirect(project.id, stage);
      if (!result.success) {
        onProjectUpdate?.({
          id: project.id,
          status: prevStatus,
          publishDate: prevPublishDate,
          reviewFeedback: prevReviewFeedback,
          reviewLink: prevReviewLink,
          draftVersion: prevDraftVersion,
        });
        if (isDraftRejection) {
          setReviewLink(prevReviewLink || "");
        }
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
      showToast(t("projectModal.titleRequired"), "error");
      return;
    }
    if (contentType === "Sponsored" && !sponsorshipId) {
      showToast(t("projectModal.selectSponsorshipDealError"), "error");
      return;
    }
    startTransition(async () => {
      const result = await createProject({
        title,
        contentType,
        format,
        platformsTargeted: platforms,
        briefingNotes: contentType === "Sponsored" ? briefingNotes : undefined,
        productLinks: contentType === "Sponsored" ? productLinks.trim() || undefined : undefined,
        sponsorshipId: contentType === "Sponsored" ? sponsorshipId : undefined,
      });
      if (result.success) {
        showToast(t("projectModal.created"), "success");
        onCreated();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast(t("projectModal.copiedToClipboard"), "success");
  }

  // Compute completion %
  const allShots = [...aRollShots, ...bRollShots];
  const completedShots = allShots.filter((s) => s.isCompleted).length;
  const completionPct = allShots.length > 0 ? Math.round((completedShots / allShots.length) * 100) : 0;
  const currentFolderName = isEditing ? folderName.trim() || project.folderName || "" : "";
  const nasPaths = isEditing && currentFolderName && nasConfig
    ? generateNasPaths(currentFolderName, project.status, project.publishDate, nasConfig)
    : null;
  const rawPath = detectedOS === "mac" ? nasPaths?.macPath : detectedOS === "win" ? nasPaths?.winPath : "";
  const osBadge = detectedOS === "mac" ? "[  ]" : detectedOS === "win" ? "[ ⊞ ]" : "[ ? ]";
  const scriptStatusLabel =
    scriptSaveStatus === "dirty"
      ? t("projectModal.autosaveQueued")
      : scriptSaveStatus === "saving"
        ? t("projectModal.autosaving")
        : scriptSaveStatus === "error"
          ? t("projectModal.autosaveFailed")
          : scriptSaveStatus === "saved"
            ? t("projectModal.savedBracket")
            : t("projectModal.autosave");
  const selectedSponsorship =
    sponsorshipDeals.find((deal) => deal.id === sponsorshipId) ?? null;
  const linkedSponsorship = isEditing ? project.sponsorship ?? null : null;
  const briefingContext =
    isEditing && project.contentType === "Sponsored"
      ? project.briefingNotes?.trim() || linkedSponsorship?.notes?.trim() || ""
      : "";

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
      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-5xl ui-panel flex flex-col md:max-h-[90vh] motion-panel-in">

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
                  {getContentTypeLabel(contentTypeOptions, project.contentType, locale)}
                </span>
                <span className="border border-border-visible text-text-secondary px-2 py-1 text-[10px] font-mono uppercase">
                  {project.format.replace("_", " ")}
                </span>
              </div>
            )}
            <div className="flex items-center text-text-display">
              <input
                className="min-w-0 flex-1 text-xl md:text-2xl font-bold bg-transparent outline-none uppercase placeholder:text-text-disabled"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                placeholder={t("projectModal.projectTitlePlaceholder")}
                readOnly={isEditing}
              />
              {(isEditing || isTitleFocused) && (
                <span className="animate-cursor-blink inline-block w-2 h-4 bg-current ml-1 shrink-0" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-end ml-4 shrink-0">
            <button onClick={onClose} className="text-text-secondary hover:bg-text-display hover:text-text-inverse font-mono text-xs mb-2 px-1">
              [ X ]
            </button>
            {isEditing && (
              <div className="text-right">
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block">{t("projectModal.completion")}</span>
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
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("projectModal.contentType")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {contentTypeOptions.map((ct) => (
                      <button key={ct.value} type="button" onClick={() => handleContentTypeSelect(ct.value)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest",
                        contentType === ct.value ? "border border-text-display text-text-display bg-transparent" : "border border-border-visible text-text-secondary bg-transparent hover:bg-text-display hover:text-text-inverse hover:border-text-display"
                      )}>{getContentTypeLabel(contentTypeOptions, ct.value, locale)}</button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("projectModal.format")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {FORMATS.map((f) => (
                      <button key={f} type="button" onClick={() => handleFormatSelect(f)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest",
                        format === f ? "border border-text-display text-text-display bg-transparent" : "border border-border-visible text-text-secondary bg-transparent hover:bg-text-display hover:text-text-inverse hover:border-text-display"
                      )}>{t(`format.${f}`)}</button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("projectModal.platforms")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {visiblePlatforms.map((p) => (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest",
                        platforms.includes(p) ? "border border-text-display text-text-display bg-transparent" : "border border-border-visible text-text-secondary bg-transparent hover:bg-text-display hover:text-text-inverse hover:border-text-display"
                      )}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Sponsorship Deal */}
                {contentType === "Sponsored" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                        {t("projectModal.sponsorshipDeal")}<span className="text-accent ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={sponsorshipId}
                          onChange={(e) => handleSponsorshipSelect(e.target.value)}
                          className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 pr-6 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display appearance-none cursor-pointer color-scheme-dark"
                        >
                          <option value="" className="bg-surface text-text-primary">
                            {sponsorshipDeals.length > 0 ? t("projectModal.selectSponsorshipDeal") : t("projectModal.noActiveDeals")}
                          </option>
                          {sponsorshipDeals.map((deal) => (
                            <option key={deal.id} value={deal.id} className="bg-surface text-text-primary">
                              {deal.brandName} / {t(`sponsorshipModal.${deal.status.toLowerCase()}`)} / {formatDealMoney(deal.budget, deal.currency)}
                              {deal.currency !== deal.preferredCurrency && deal.budgetPreferred !== null
                                ? ` -> ${formatDealMoney(deal.budgetPreferred, deal.preferredCurrency)}`
                                : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown />
                      </div>
                    </div>

                    {selectedSponsorship && (
                      <div className="border border-border-visible bg-surface p-3 font-mono text-xs">
                        <div className="flex items-center justify-between gap-3 border-b border-border-visible pb-2">
                          <span className="text-text-display uppercase tracking-widest">
                            {selectedSponsorship.brandName}
                          </span>
                          <span className="text-text-secondary uppercase tracking-widest">
                            {t(`sponsorshipModal.${selectedSponsorship.status.toLowerCase()}`)}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] uppercase tracking-widest">
                          <div>
                            <div className="text-text-disabled">{t("projectModal.budget")}</div>
                            <div className="mt-1 text-success">
                              {formatDealMoney(selectedSponsorship.budget, selectedSponsorship.currency)}
                            </div>
                            {selectedSponsorship.currency !== selectedSponsorship.preferredCurrency &&
                              selectedSponsorship.budgetPreferred !== null && (
                                <div className="mt-1 text-text-secondary">
                                  {formatDealMoney(
                                    selectedSponsorship.budgetPreferred,
                                    selectedSponsorship.preferredCurrency
                                  )}
                                </div>
                              )}
                          </div>
                          <div>
                            <div className="text-text-disabled">{t("projectModal.due")}</div>
                            <div className="mt-1 text-text-display">{formatDealDate(selectedSponsorship.dueDate, locale)}</div>
                          </div>
                          <div>
                            <div className="text-text-disabled">{t("projectModal.contact")}</div>
                            <div className="mt-1 text-text-display break-all">
                              {selectedSponsorship.contactEmail || "—"}
                            </div>
                          </div>
                        </div>
                        {selectedSponsorship.notes && (
                          <div className="mt-3 border-t border-border-visible pt-3 text-text-secondary whitespace-pre-wrap">
                            {selectedSponsorship.notes}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                        {t("projectModal.briefingSnapshot")}
                      </label>
                      <textarea
                        value={briefingNotes}
                        onChange={(e) => setBriefingNotes(e.target.value)}
                        placeholder={t("projectModal.briefingSnapshotPlaceholder")}
                        className="w-full ui-textarea p-3 text-sm min-h-[100px] resize-y"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                        {t("projectModal.productTrackingLinks")}
                      </label>
                      <textarea
                        value={productLinks}
                        onChange={(e) => setProductLinks(e.target.value)}
                        placeholder={t("projectModal.productTrackingPlaceholder")}
                        className="w-full ui-textarea p-3 text-sm min-h-[80px] resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border-visible">
                  <button type="button" onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-text-secondary border border-border-visible hover:bg-text-display hover:text-text-inverse hover:border-text-display">
                    {t("projectModal.cancel")}
                  </button>
                  <button type="submit" disabled={isPending} className={cn(
                    "px-6 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-text-display bg-text-display text-text-inverse hover:bg-background hover:text-text-display",
                    isPending && "opacity-50 cursor-wait"
                  )}>
                    {isPending ? t("projectModal.creating") : t("projectModal.createProject")}
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
                          {t("projectModal.exportAssets")}
                        </h3>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block">
                            {t("projectModal.scheduled")}
                          </span>
                          <span className="text-sm font-mono text-text-display tracking-widest">
                            {formatPublishDate(project.publishedAt ?? project.publishDate, locale)}
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
                      className="w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display mb-4"
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
                      className="w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display mb-4"
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
                      className="w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display mb-4"
                    />

                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={isSavingIds}
                        className={cn(
                          "px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-border-visible text-text-secondary hover:bg-text-display hover:text-text-inverse hover:border-text-display",
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
                    <h3 className="text-xs font-bold text-accent uppercase font-mono">{t("projectModal.revisionRequired")}</h3>
                    <p className="text-sm text-accent/80 mt-2 whitespace-pre-wrap">{project.reviewFeedback}</p>
                  </div>
                )}

                {/* ── Asset Management ── */}
                <div className="hidden md:block">
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("projectModal.assetManagement")}</label>

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
                        placeholder={t("projectModal.folderNameEnterPlaceholder")}
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
                          {rawPath || t("projectModal.folderNameGeneratePlaceholder")}
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
                          className="text-[10px] font-mono text-text-secondary hover:bg-text-display hover:text-text-inverse px-3 py-2.5"
                        >
                          [ EDIT ]
                        </button>
                        {rawPath && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(rawPath)}
                            className="text-[10px] font-mono text-text-secondary hover:bg-text-display hover:text-text-inverse px-3 py-2.5 border-l border-border-visible"
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
                    {!reviewLink && (
                      <button
                        type="button"
                        onClick={handleScanForDrafts}
                        disabled={isScanningDraft}
                        className="text-[10px] font-mono uppercase tracking-widest text-success hover:bg-success hover:text-text-inverse hover:border-success px-3 py-2.5 border-l border-border-visible shrink-0 whitespace-nowrap disabled:cursor-wait disabled:opacity-50"
                      >
                        {isScanningDraft ? t("projectModal.scanning") : t("projectModal.scanForDraft", { version: project.draftVersion })}
                      </button>
                    )}
                    {reviewLink && (
                      <a
                        href={reviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:bg-text-display hover:text-text-inverse px-3 py-2.5 border-l border-border-visible shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Sponsorship Context (Sponsored) ── */}
                {project.contentType === "Sponsored" && (linkedSponsorship || briefingContext) && (
                  <div>
                    <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                      {t("projectModal.sponsorshipContext")}
                    </label>
                    {linkedSponsorship && (
                      <div className="mb-3 border border-border-visible bg-surface p-3 font-mono text-xs">
                        <div className="flex items-center justify-between gap-3 border-b border-border-visible pb-2">
                          <span className="text-text-display uppercase tracking-widest">
                            {linkedSponsorship.brandName}
                          </span>
                          <span className="text-text-secondary uppercase tracking-widest">
                            {t(`sponsorshipModal.${linkedSponsorship.status.toLowerCase()}`)}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] uppercase tracking-widest">
                          <div>
                            <div className="text-text-disabled">{t("projectModal.budget")}</div>
                            <div className="mt-1 text-success">
                              {formatDealMoney(linkedSponsorship.budget, linkedSponsorship.currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-text-disabled">{t("projectModal.due")}</div>
                            <div className="mt-1 text-text-display">{formatDealDate(linkedSponsorship.dueDate, locale)}</div>
                          </div>
                          <div>
                            <div className="text-text-disabled">{t("projectModal.contact")}</div>
                            <div className="mt-1 text-text-display break-all">
                              {linkedSponsorship.contactEmail || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {briefingContext && (
                      <div className="bg-surface border border-border-visible p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap">
                        {briefingContext}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Task Progress — Shot Lists ── */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("projectModal.taskProgress")}</label>
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
                          <span className="text-[10px] font-mono text-text-disabled italic px-2">{t("projectModal.noShotsDefined")}</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={t("projectModal.addShotPlaceholderShort")}
                        value={aRollDraft}
                        onChange={(e) => setARollDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addShot("a");
                          }
                        }}
                        className="w-full bg-surface border border-border-visible text-text-primary font-mono text-xs p-2 focus:outline-none focus:border-text-display/50 mt-2"
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
                          <span className="text-[10px] font-mono text-text-disabled italic px-2">{t("projectModal.noShotsDefined")}</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={t("projectModal.addShotPlaceholderShort")}
                        value={bRollDraft}
                        onChange={(e) => setBRollDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addShot("b");
                          }
                        }}
                        className="w-full bg-surface border border-border-visible text-text-primary font-mono text-xs p-2 focus:outline-none focus:border-text-display/50 mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Script Editor ── */}
                <div className="pt-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase">
                      {t("projectModal.scriptNotes")}
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
                  {t("projectModal.createdBy")}
                </label>
                <span className="text-xs font-bold text-text-display uppercase tracking-wider block truncate">
                  {isEditing && project.creator ? project.creator.name : "—"}
                </span>
              </div>

              {/* Client / Brand (Sponsored only) */}
              {isEditing && project.contentType === "Sponsored" && (
                <div className="mb-6">
                  <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                    {t("projectModal.clientBrand")}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      linkedSponsorship?.brandName ||
                      project.briefingNotes?.split("\n")[0]?.replace(/^Client:\s*/i, "") ||
                      ""
                    }
                    placeholder="—"
                    className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display whitespace-nowrap overflow-x-auto"
                  />
                </div>
              )}

              {/* Scope Deadlines */}
              <div className="mb-6">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  {t("projectModal.scopeDeadlines")}
                </label>
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="text-[10px] font-mono text-text-disabled uppercase tracking-widest mb-1">
                        {t("stageDisplay.Scripting")}
                      </div>
                      <input
                        type="date"
                        value={scriptingDueDate}
                        min={minDeadlineDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setScriptingDueDate(value);
                          saveMetadata({ scriptingDueDate: value || null });
                        }}
                        className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display color-scheme-dark"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-text-disabled uppercase tracking-widest mb-1">
                        {t("stageDisplay.Filming")}
                      </div>
                      <input
                        type="date"
                        value={filmingDueDate}
                        min={minDeadlineDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilmingDueDate(value);
                          saveMetadata({ filmingDueDate: value || null });
                        }}
                        className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display color-scheme-dark"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-text-disabled uppercase tracking-widest mb-1">
                        {t("stageDisplay.Editing")}
                      </div>
                      <input
                        type="date"
                        value={editingDueDate}
                        min={minDeadlineDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditingDueDate(value);
                          saveMetadata({ editingDueDate: value || null });
                        }}
                        className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display color-scheme-dark"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-text-display uppercase tracking-wider block">
                    {t("projectModal.notSet")}
                  </span>
                )}
              </div>

              {/* Lead Editor */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  {t("projectModal.leadEditor")}
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
                      className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-surface">{t("common.unassigned")}</option>
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
                    {t("projectModal.autoAssigned")}
                  </span>
                )}
              </div>

              {/* Cameraman */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  {t("projectModal.cameraman")}
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
                      className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-surface">{t("common.unassigned")}</option>
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
                  {t("projectModal.aRollTalent")}
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
                      className="w-full bg-transparent border-b border-border-visible pb-2 pt-1 text-text-display font-mono text-xs uppercase outline-none focus:border-text-display appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-surface">{t("common.unassigned")}</option>
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

            {/* ── {t("projectModal.productAffiliateLinks")} (Ideation planning) ── */}
            {isEditing && (
              <div className="mb-6">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-2">
                  {t("projectModal.productAffiliateLinks")}
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
                  className="w-full bg-surface border border-border-visible p-3 text-xs font-mono text-text-primary uppercase focus:outline-none focus:border-text-display min-h-[80px] resize-y mt-1"
                />
              </div>
            )}

            {/* ── Divider ── */}
            {isEditing && <div className="border-t border-border-visible my-4" />}

            {/* ── Platforms ── */}
            <div>
              <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-3">{t("projectModal.platforms")}</label>
              <div className="flex flex-wrap gap-2">
                {visiblePlatforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => (isEditing ? handlePlatformToggle(p) : togglePlatform(p))}
                    disabled={isPending}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest disabled:opacity-50",
                      platforms.includes(p)
                        ? "border border-text-display text-text-display"
                        : "border border-border-visible text-text-disabled hover:bg-text-display hover:text-text-inverse hover:border-text-display"
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
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block mb-3">{t("projectModal.pipelineStage")}</label>
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
                          "group flex items-center gap-2 py-1 px-2 w-full text-left disabled:cursor-default",
                          !isCurrent && "hover:bg-text-display hover:text-text-inverse",
                          !isCurrent && "cursor-pointer"
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          isCurrent ? statusColors[stage] || "bg-text-display" : isPast ? "bg-text-secondary" : "bg-surface-raised"
                        )} />
                        <span className={cn(
                          "text-[10px] font-mono uppercase tracking-widest",
                          isCurrent ? "text-text-display" : isPast ? "text-text-secondary group-hover:text-text-inverse" : "text-text-disabled group-hover:text-text-inverse"
                        )}>
                          {t(`stage.${stage}`)}
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
