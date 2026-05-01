"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateProjectStats } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

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
  "w-full bg-transparent border-b border-border-visible pb-2 text-text-display font-mono text-sm focus:outline-none focus:border-text-display";

function initialStatString(n: number | null | undefined): string {
  const safe = Number(n ?? 0);
  return safe > 0 ? String(safe) : "";
}

function sanitizeDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export default function UpdateStatsModal({
  project,
  onClose,
  onUpdated,
}: UpdateStatsModalProps) {
  const { showToast } = useToast();
  const t = useT();
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
      showToast(t("statsModal.negativeError"), "error");
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
      showToast(t("statsModal.updated"), "success");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div
        className="absolute inset-0 ui-modal-backdrop"
        onClick={() => !isPending && onClose()}
      />

      <div
        className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[28rem] ui-panel p-4 md:p-6 flex flex-col min-w-0 overflow-y-auto md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6 w-full gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-display uppercase tracking-widest">
              {t("statsModal.title")}
            </h2>
            <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-1 truncate">
              {project.finalTitle ?? project.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-text-secondary hover:bg-text-display hover:text-text-inverse font-mono text-xs shrink-0 px-1"
          >
            {t("statsModal.close")}
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
              className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2 block"
            >
              {t("statsModal.views")}
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
              className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2 block"
            >
              {t("statsModal.likes")}
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
              className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2 block"
            >
              {t("statsModal.comments")}
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

        <div className="flex flex-col md:flex-row md:justify-end gap-3 md:gap-4 mt-8 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="ui-button-outline px-4 py-2 disabled:opacity-50"
          >
            {t("statsModal.cancel")}
          </button>
          <button
            type="submit"
            form="stats-form"
            disabled={isPending}
            className={cn(
              "ui-button-primary px-6 py-2 flex items-center justify-center gap-2",
              isPending && "opacity-50 cursor-wait"
            )}
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            {isPending ? t("statsModal.saving") : t("statsModal.saveStats")}
          </button>
        </div>
      </div>
    </div>
  );
}
