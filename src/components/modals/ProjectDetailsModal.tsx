"use client";

import { useState, useEffect, useTransition } from "react";
import {
  createProject,
  getUsers,
  updateProjectMetadata,
  updateProjectShotlist,
  updateProjectAssets,
  updatePlatformIds,
} from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import { CONTENT_TYPES, FORMATS, PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { parsePlatforms } from "@/lib/utils";
import ShotRow from "@/components/kanban/ShotRow";
import CopyBlock from "@/components/ui/CopyBlock";
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
      className="pointer-events-none absolute right-0 bottom-2 w-3 h-3 text-gray-500"
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

  // Interactive metadata state
  const [dueDate, setDueDate] = useState("");
  const [editorId, setEditorId] = useState("");
  const [cameramanId, setCameramanId] = useState("");
  const [talentId, setTalentId] = useState("");

  // Asset Management state
  const [storagePath, setStoragePath] = useState("");
  const [reviewLink, setReviewLink] = useState("");

  // Ideation metadata
  const [productLinks, setProductLinks] = useState("");

  // Platform API IDs (Published post-publish edit)
  const [youtubeId, setYoutubeId] = useState("");
  const [metaId, setMetaId] = useState("");
  const [tiktokId, setTiktokId] = useState("");
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
    if (project) {
      setTitle(project.title);
      setContentType(project.contentType);
      setFormat(project.format);
      setPlatforms(parsePlatforms(project.platformsTargeted));
      setBriefingNotes(project.briefingNotes || "");
      setARollShots(parseShotItems(project.aRollShots));
      setBRollShots(parseShotItems(project.bRollShots));
      setDueDate(toDateInputValue(project.dueDate));
      setEditorId(project.assignedEditor?.id || project.assignedEditorId || "");
      setCameramanId(project.assignedCameraman?.id || project.assignedCameramanId || "");
      setTalentId(project.assignedTalent?.id || project.assignedTalentId || "");
      setStoragePath(project.storagePath || "");
      setReviewLink(project.reviewLink || "");
      setProductLinks(project.productLinks || "");
      setYoutubeId(project.youtubeId || "");
      setMetaId(project.metaId || "");
      setTiktokId(project.tiktokId || "");
    } else {
      setTitle("");
      setContentType("Organic");
      setFormat("Short_Form");
      setPlatforms([]);
      setBriefingNotes("");
      setARollShots([]);
      setBRollShots([]);
      setDueDate("");
      setEditorId("");
      setCameramanId("");
      setTalentId("");
      setStoragePath("");
      setReviewLink("");
      setProductLinks("");
      setYoutubeId("");
      setMetaId("");
      setTiktokId("");
    }
    setARollDraft("");
    setBRollDraft("");
  }, [project]);

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

  function saveAssets(patch: { storagePath?: string; reviewLink?: string }) {
    if (!project) return;
    const normalized: { storagePath?: string | null; reviewLink?: string | null } = {};
    if (patch.storagePath !== undefined) {
      const trimmed = patch.storagePath.trim();
      if (trimmed === (project.storagePath || "")) return;
      normalized.storagePath = trimmed || null;
    }
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
      showToast("Platform IDs updated.", "success");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#0f0f0f] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">

        {/* ─── HEADER ─── */}
        <div className="flex justify-between items-start p-6 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            {isEditing && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className={cn("w-2 h-2 rounded-full", statusColors[project.status] || "bg-gray-500")} />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  ID: {project.id.slice(0, 8)}
                </span>
                <span className="border border-gray-800 text-gray-500 px-2 py-1 text-[10px] font-mono uppercase">
                  {project.status}
                </span>
                <span className="border border-gray-800 text-gray-500 px-2 py-1 text-[10px] font-mono uppercase">
                  {project.contentType.replace("_", " ")}
                </span>
                <span className="border border-gray-800 text-gray-500 px-2 py-1 text-[10px] font-mono uppercase">
                  {project.format.replace("_", " ")}
                </span>
              </div>
            )}
            <input
              className="text-2xl font-bold text-white bg-transparent outline-none uppercase w-full placeholder:text-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="PROJECT TITLE"
              readOnly={isEditing}
            />
          </div>

          <div className="flex flex-col items-end ml-4 shrink-0">
            <button onClick={onClose} className="text-gray-500 hover:text-white font-mono text-xs mb-2 transition-colors">
              [ X ]
            </button>
            {isEditing && (
              <div className="text-right">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Completion</span>
                <div className="text-3xl font-mono text-white tracking-widest">{completionPct}%</div>
              </div>
            )}
          </div>
        </div>

        {/* ─── TWO-COLUMN BODY ─── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ═══ LEFT COLUMN — Assets & Tasks ═══ */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-white/10">

            {/* CREATE MODE — form fields */}
            {!isEditing && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Content Type */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Content Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {CONTENT_TYPES.map((ct) => (
                      <button key={ct} type="button" onClick={() => setContentType(ct)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                        contentType === ct ? "border border-white text-white bg-transparent" : "border border-gray-800 text-gray-500 bg-transparent hover:border-gray-600"
                      )}>{ct.replace("_", " ")}</button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Format</label>
                  <div className="flex gap-2 flex-wrap">
                    {FORMATS.map((f) => (
                      <button key={f} type="button" onClick={() => setFormat(f)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                        format === f ? "border border-white text-white bg-transparent" : "border border-gray-800 text-gray-500 bg-transparent hover:border-gray-600"
                      )}>{f.replace("_", " ")}</button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Platforms</label>
                  <div className="flex gap-2 flex-wrap">
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                        platforms.includes(p) ? "border border-white text-white bg-transparent" : "border border-gray-800 text-gray-500 bg-transparent hover:border-gray-600"
                      )}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Briefing Notes */}
                {contentType === "Sponsored" && (
                  <div>
                    <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
                      Briefing Notes<span className="text-accent ml-1">*</span>
                    </label>
                    <textarea
                      value={briefingNotes}
                      onChange={(e) => setBriefingNotes(e.target.value)}
                      placeholder="Client requirements, talking points, deliverables..."
                      className="w-full bg-[#0f0f0f] border border-gray-800 p-3 text-sm text-gray-400 focus:outline-none focus:border-gray-600 min-h-[100px] resize-y"
                    />
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button type="button" onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-500 border border-gray-800 hover:border-gray-600 transition-colors">
                    CANCEL
                  </button>
                  <button type="submit" disabled={isPending} className={cn(
                    "px-6 py-1.5 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-colors",
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
                    <div className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          Export Assets
                        </h3>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                            Scheduled
                          </span>
                          <span className="text-sm font-mono text-white tracking-widest">
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
                              <span className="text-gray-600 italic">
                                No caption or hashtags captured.
                              </span>
                            )}
                          </CopyBlock>
                          <CopyBlock
                            label="YT SHORTS"
                            copyValue={caption || "—"}
                          >
                            {caption || (
                              <span className="text-gray-600 italic">
                                No caption captured.
                              </span>
                            )}
                          </CopyBlock>
                        </div>
                      )}

                      {/* Long-Form export blocks */}
                      {project.format === "Long_Form" && (
                        <div className="flex flex-col gap-3">
                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
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
                              <div className="bg-[#0a0a0a] border border-white/10 p-4 text-xs font-mono text-gray-600 italic">
                                No A/B titles captured.
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">
                            Thumbnails
                          </div>
                          {thumbnailsList.length > 0 ? (
                            <ul className="flex flex-col gap-1 bg-[#0a0a0a] border border-white/10 p-4">
                              {thumbnailsList.map((t, i) => (
                                <li
                                  key={`thumb-${i}`}
                                  className="text-xs font-mono text-gray-300 break-all"
                                >
                                  <span className="text-gray-600 mr-2">{i + 1}.</span>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="bg-[#0a0a0a] border border-white/10 p-4 text-xs font-mono text-gray-600 italic">
                              No thumbnails captured.
                            </div>
                          )}
                        </div>
                      )}

                      {project.format !== "Short_Form" && project.format !== "Long_Form" && (
                        <div className="text-xs font-mono text-gray-600 italic">
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
                    className="border border-white/10 bg-[#0a0a0a] p-4 flex flex-col"
                  >
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      Platform API IDs
                    </h3>

                    <label
                      htmlFor="platform-youtube"
                      className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2 block"
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
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors mb-4"
                    />

                    <label
                      htmlFor="platform-meta"
                      className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2 block"
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
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors mb-4"
                    />

                    <label
                      htmlFor="platform-tiktok"
                      className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2 block"
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
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors mb-4"
                    />

                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={isSavingIds}
                        className={cn(
                          "px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-white/10 text-gray-400 hover:text-white hover:border-white transition-colors",
                          isSavingIds && "opacity-50 cursor-wait"
                        )}
                      >
                        {isSavingIds ? "[ UPDATING... ]" : "[ UPDATE IDs ]"}
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
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Asset Management</label>

                  {/* Raw Storage Path */}
                  <div className="bg-black border border-white/10 flex items-center mb-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-3 shrink-0 border-r border-white/10 py-2.5">
                      RAW
                    </span>
                    <input
                      type="text"
                      value={storagePath}
                      onChange={(e) => setStoragePath(e.target.value)}
                      onBlur={() => saveAssets({ storagePath })}
                      placeholder="\\truenas\projects\..."
                      className="flex-1 bg-transparent text-xs font-mono text-gray-300 px-3 py-2.5 outline-none placeholder:text-gray-700"
                    />
                    {storagePath && (
                      <button
                        onClick={() => copyToClipboard(storagePath)}
                        className="text-[10px] font-mono text-gray-500 hover:text-white px-3 py-2.5 border-l border-white/10 transition-colors shrink-0"
                      >
                        [ COPY ]
                      </button>
                    )}
                  </div>

                  {/* Nextcloud Link */}
                  <div className="bg-black border border-white/10 flex items-center">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-3 shrink-0 border-r border-white/10 py-2.5">
                      REVIEW
                    </span>
                    <input
                      type="text"
                      value={reviewLink}
                      onChange={(e) => setReviewLink(e.target.value)}
                      onBlur={() => saveAssets({ reviewLink })}
                      placeholder="https://nc.studio.local/s/..."
                      className="flex-1 bg-transparent text-xs font-mono text-gray-300 px-3 py-2.5 outline-none placeholder:text-gray-700"
                    />
                    {reviewLink && (
                      <a
                        href={reviewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white px-3 py-2.5 border-l border-white/10 transition-colors shrink-0"
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
                    <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
                      Briefing Notes
                    </label>
                    <div className="bg-black border border-white/10 p-3 text-xs font-mono text-gray-400 whitespace-pre-wrap">
                      {project.briefingNotes}
                    </div>
                  </div>
                )}

                {/* ── Task Progress — Shot Lists ── */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Task Progress</label>
                  <div className="grid grid-cols-2 gap-6">

                    {/* A-ROLL */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", project.aRollComplete ? "bg-success" : "bg-warning")} />
                          A-ROLL
                        </span>
                        <span className="text-[10px] font-mono text-gray-600">
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
                          <span className="text-[10px] font-mono text-gray-700 italic px-2">No shots defined</span>
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
                        className="w-full bg-[#0a0a0a] border border-white/10 text-gray-300 font-mono text-xs p-2 focus:outline-none focus:border-white/50 transition-colors mt-2"
                      />
                    </div>

                    {/* B-ROLL */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <span className={cn("w-1.5 h-1.5 rounded-full", project.bRollComplete ? "bg-success" : "bg-warning")} />
                          B-ROLL
                        </span>
                        <span className="text-[10px] font-mono text-gray-600">
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
                          <span className="text-[10px] font-mono text-gray-700 italic px-2">No shots defined</span>
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
                        className="w-full bg-[#0a0a0a] border border-white/10 text-gray-300 font-mono text-xs p-2 focus:outline-none focus:border-white/50 transition-colors mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN — Metadata Sidebar ═══ */}
          <div className="w-80 shrink-0 overflow-y-auto p-6 bg-[#0a0a0a]">

            {/* ── Metadata ── */}
            <div className="flex flex-col">
              {/* Created By */}
              <div className="mb-6">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
                  Created By
                </label>
                <span className="text-xs font-bold text-white uppercase tracking-wider block truncate">
                  {isEditing && project.creator ? project.creator.name : "—"}
                </span>
              </div>

              {/* Client / Brand (Sponsored only) */}
              {isEditing && project.contentType === "Sponsored" && (
                <div className="mb-6">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
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
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pt-1 text-white font-mono text-xs uppercase outline-none focus:border-white transition-colors whitespace-nowrap overflow-x-auto"
                  />
                </div>
              )}

              {/* Due Date */}
              <div className="mb-6">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
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
                    className="w-full bg-transparent border-b border-gray-800 pb-2 pt-1 text-white font-mono text-xs uppercase outline-none focus:border-white transition-colors color-scheme-dark"
                    style={{ colorScheme: "dark" }}
                  />
                ) : (
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Not set
                  </span>
                )}
              </div>

              {/* Lead Editor */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
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
                      className="w-full bg-transparent border-b border-gray-800 pb-2 pt-1 text-white font-mono text-xs uppercase outline-none focus:border-white transition-colors appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-black">Unassigned</option>
                      {users
                        .filter((u) => u.role === "Editor_Shorts" || u.role === "Editor_FullStack")
                        .map((u) => (
                          <option key={u.id} value={u.id} className="bg-black">
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown />
                  </>
                ) : (
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                    Auto-assigned
                  </span>
                )}
              </div>

              {/* Cameraman */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
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
                      className="w-full bg-transparent border-b border-gray-800 pb-2 pt-1 text-white font-mono text-xs uppercase outline-none focus:border-white transition-colors appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-black">Unassigned</option>
                      {users
                        .filter((u) => u.role === "Cameraman")
                        .map((u) => (
                          <option key={u.id} value={u.id} className="bg-black">
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown />
                  </>
                ) : (
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">—</span>
                )}
              </div>

              {/* A-Roll Talent */}
              <div className="mb-6 relative">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
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
                      className="w-full bg-transparent border-b border-gray-800 pb-2 pt-1 text-white font-mono text-xs uppercase outline-none focus:border-white transition-colors appearance-none cursor-pointer pr-6"
                    >
                      <option value="" className="bg-black">Unassigned</option>
                      {users
                        .filter((u) => u.role === "Talent")
                        .map((u) => (
                          <option key={u.id} value={u.id} className="bg-black">
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown />
                  </>
                ) : (
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">—</span>
                )}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-white/10 my-4" />

            {/* ── Product / Affiliate Links (Ideation planning) ── */}
            {isEditing && (
              <div className="mb-6">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-2">
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
                  className="w-full bg-[#0a0a0a] border border-gray-800 p-3 text-xs font-mono text-gray-300 uppercase focus:outline-none focus:border-white transition-colors min-h-[80px] resize-y mt-1"
                />
              </div>
            )}

            {/* ── Divider ── */}
            {isEditing && <div className="border-t border-white/10 my-4" />}

            {/* ── Platforms ── */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-3">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => !isEditing && togglePlatform(p)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
                      platforms.includes(p)
                        ? "border border-white text-white"
                        : "border border-gray-800 text-gray-600 hover:border-gray-600"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-white/10 my-4" />

            {/* ── Status Timeline ── */}
            {isEditing && (
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-3">Pipeline Stage</label>
                <div className="flex flex-col gap-1">
                  {["Ideation", "Scripting", "Filming", "Editing", "Review", "Published"].map((stage) => {
                    const stageIndex = ["Ideation", "Scripting", "Filming", "Editing", "Review", "Published"].indexOf(stage);
                    const currentIndex = ["Ideation", "Scripting", "Filming", "Editing", "Review", "Published"].indexOf(project.status);
                    const isPast = stageIndex < currentIndex;
                    const isCurrent = stage === project.status;

                    return (
                      <div key={stage} className="flex items-center gap-2 py-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          isCurrent ? statusColors[stage] || "bg-white" : isPast ? "bg-gray-600" : "bg-gray-800"
                        )} />
                        <span className={cn(
                          "text-[10px] font-mono uppercase tracking-widest",
                          isCurrent ? "text-white" : isPast ? "text-gray-500" : "text-gray-700"
                        )}>
                          {stage}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-gray-500 ml-auto">←</span>
                        )}
                      </div>
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
