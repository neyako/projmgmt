"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateProjectStats } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";

interface UpdateStatsModalProps {
  project: {
    id: string;
    title: string;
    finalTitle?: string | null;
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
  };
  onClose: () => void;
  onUpdated?: (stats: { views: number; likes: number; comments: number }) => void;
}

const INPUT_CLASS =
  "w-full bg-transparent border-b border-gray-800 pb-2 text-white font-mono text-sm focus:outline-none focus:border-white transition-colors";

// Empty string when 0 so the field opens blank; otherwise show existing count.
function initialStatString(n: number | null | undefined): string {
  const safe = Number(n ?? 0);
  return safe > 0 ? String(safe) : "";
}

// Keep digits only. type="text" + inputMode="numeric" sidesteps the
// native number-input controlled-state quirk that silently dropped keys.
function sanitizeDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export default function UpdateStatsModal({
  project,
  onClose,
  onUpdated,
}: UpdateStatsModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [views, setViews] = useState<string>(initialStatString(project.views));
  const [likes, setLikes] = useState<string>(initialStatString(project.likes));
  const [comments, setComments] = useState<string>(
    initialStatString(project.comments)
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(views || 0);
    const l = Number(likes || 0);
    const c = Number(comments || 0);
    if ([v, l, c].some((n) => !Number.isFinite(n) || n < 0)) {
      showToast("Stats must be non-negative numbers.", "error");
      return;
    }
    startTransition(async () => {
      const result = await updateProjectStats(project.id, {
        views: v,
        likes: l,
        comments: c,
      });
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      onUpdated?.({ views: v, likes: l, comments: c });
      showToast("Stats updated.", "success");
      onClose();
    });
  }

  return (
    // Background Overlay
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={() => !isPending && onClose()}
    >
      {/* The Actual Modal Box - FORCED WIDTH */}
      <div
        className="relative w-full max-w-[28rem] bg-[#0a0a0a] border border-white/10 shadow-2xl p-6 flex flex-col min-w-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6 w-full gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest">
              Manual Analytics Entry
            </h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1 truncate">
              {project.finalTitle ?? project.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-gray-500 hover:text-white font-mono text-xs transition-colors shrink-0"
          >
            [ X ]
          </button>
        </div>

        <form
          id="stats-form"
          onSubmit={handleSubmit}
          className="flex flex-col space-y-6 w-full"
        >
          <div className="w-full">
            <label
              htmlFor="stats-views"
              className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2 block"
            >
              Views
            </label>
            <input
              id="stats-views"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={views}
              onChange={(e) => setViews(sanitizeDigits(e.target.value))}
              placeholder="0"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          <div className="w-full">
            <label
              htmlFor="stats-likes"
              className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2 block"
            >
              Likes
            </label>
            <input
              id="stats-likes"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={likes}
              onChange={(e) => setLikes(sanitizeDigits(e.target.value))}
              placeholder="0"
              className={INPUT_CLASS}
            />
          </div>

          <div className="w-full">
            <label
              htmlFor="stats-comments"
              className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2 block"
            >
              Comments
            </label>
            <input
              id="stats-comments"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={comments}
              onChange={(e) => setComments(sanitizeDigits(e.target.value))}
              placeholder="0"
              className={INPUT_CLASS}
            />
          </div>
        </form>

        <div className="flex justify-end gap-4 mt-8 w-full">
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
            form="stats-form"
            disabled={isPending}
            className={cn(
              "px-6 py-2 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2",
              isPending && "opacity-50 cursor-wait"
            )}
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            {isPending ? "SAVING..." : "[ SAVE STATS ]"}
          </button>
        </div>
      </div>
    </div>
  );
}
