"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { publishProject } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";

interface PublishModalProps {
  project: ProjectCardData;
  onClose: () => void;
  onPublished: (updated: Partial<ProjectCardData> & { id: string }) => void;
}

function todayInputValue(): string {
  const dt = new Date();
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const INPUT_CLASS =
  "w-full bg-transparent border-0 border-b border-gray-800 focus:border-white focus:outline-none font-mono text-sm text-white py-2 px-0 transition-colors placeholder:text-gray-700";

export default function PublishModal({
  project,
  onClose,
  onPublished,
}: PublishModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isShort = project.format === "Short_Form";
  const isLong = project.format === "Long_Form";

  const [finalTitle, setFinalTitle] = useState(project.title);
  const [publishDate, setPublishDate] = useState(todayInputValue());

  // Short-Form
  const [baseCaption, setBaseCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  // Long-Form (fixed 3-slot arrays)
  const [abTitles, setAbTitles] = useState<string[]>(["", "", ""]);
  const [thumbnails, setThumbnails] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  function updateArrayAt(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) {
    setter((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = finalTitle.trim();
    if (!trimmedTitle) {
      showToast("Final video title is required.", "error");
      return;
    }
    startTransition(async () => {
      const result = await publishProject(project.id, {
        finalTitle: trimmedTitle,
        publishedAt: publishDate || null,
        ...(isShort && {
          baseCaption: baseCaption.trim() || undefined,
          hashtags: hashtags.trim() || undefined,
        }),
        ...(isLong && {
          abTitles,
          thumbnails,
        }),
      });
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      onPublished({
        id: project.id,
        status: "Published",
      });
      showToast(`Published "${trimmedTitle}".`, "success");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={() => !isPending && onClose()}
      />

      <div className="relative w-full max-w-[48rem] bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                ID: {project.id.slice(0, 8)}
              </span>
              <span className="border border-gray-800 text-gray-500 px-2 py-1 text-[10px] font-mono uppercase">
                {project.status}
              </span>
              <span className="border border-gray-800 text-gray-500 px-2 py-1 text-[10px] font-mono uppercase">
                {project.format.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
              PUBLISHING CHECKLIST
            </h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">
              Finalize metadata before leaving the pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-gray-500 hover:text-white font-mono text-xs transition-colors ml-4 shrink-0"
          >
            [ X ]
          </button>
        </div>

        {/* Body */}
        <form
          id="publish-form"
          onSubmit={handleConfirm}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
        >
          <div>
            <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
              Final Video Title
              <span className="text-accent ml-1">*</span>
            </label>
            <input
              type="text"
              value={finalTitle}
              onChange={(e) => setFinalTitle(e.target.value)}
              placeholder="Tech Review: Desk Setup"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          {/* ─── Short-Form fields ─── */}
          {isShort && (
            <>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
                  Base Caption
                </label>
                <textarea
                  value={baseCaption}
                  onChange={(e) => setBaseCaption(e.target.value)}
                  placeholder="POV: you finally cleaned the desk..."
                  className={cn(
                    INPUT_CLASS,
                    "min-h-[96px] resize-y"
                  )}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="tech review setup"
                  className={INPUT_CLASS}
                />
                <p className="text-[10px] font-mono text-gray-600 mt-2">
                  Space separated. `#` prepended automatically on copy.
                </p>
              </div>
            </>
          )}

          {/* ─── Long-Form fields ─── */}
          {isLong && (
            <>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
                  A/B Titles
                </label>
                <div className="flex flex-col gap-3">
                  {abTitles.map((value, i) => (
                    <input
                      key={`ab-${i}`}
                      type="text"
                      value={value}
                      onChange={(e) => updateArrayAt(setAbTitles, i, e.target.value)}
                      placeholder={`Title ${i + 1}`}
                      className={INPUT_CLASS}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
                  Thumbnails
                </label>
                <div className="flex flex-col gap-3">
                  {thumbnails.map((value, i) => (
                    <input
                      key={`thumb-${i}`}
                      type="text"
                      value={value}
                      onChange={(e) => updateArrayAt(setThumbnails, i, e.target.value)}
                      placeholder={`Thumbnail ${i + 1} (path or URL)`}
                      className={INPUT_CLASS}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── Always ─── */}
          <div>
            <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">
              Publish Date
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className={cn(INPUT_CLASS, "color-scheme-dark")}
              style={{ colorScheme: "dark" }}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 border border-white/10 hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            [ CANCEL ]
          </button>
          <button
            type="submit"
            form="publish-form"
            disabled={isPending}
            className={cn(
              "px-6 py-2 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2",
              isPending && "opacity-50 cursor-wait"
            )}
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            {isPending ? "PUBLISHING..." : "[ CONFIRM & PUBLISH ]"}
          </button>
        </div>
      </div>
    </div>
  );
}
