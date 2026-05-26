"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { updateProjectStats } from "@/actions/projects";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { MotionBlock, useTerminalDismiss } from "@/components/motion/TerminalMotion";
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
  const updatedStatsRef = useRef<{ views: number; likes: number; comments: number } | null>(null);
  const handleDismissed = useCallback(() => {
    if (updatedStatsRef.current) {
      const stats = updatedStatsRef.current;
      updatedStatsRef.current = null;
      onUpdated?.(stats);
    }
    onClose();
  }, [onClose, onUpdated]);
  const {
    ref: panelRef,
    isDismissing,
    requestDismiss,
    forceDismiss,
  } = useTerminalDismiss<HTMLDivElement>(handleDismissed, { disabled: isPending });

  const [views, setViews] = useState<string>(initialStatString(project.views));
  const [likes, setLikes] = useState<string>(initialStatString(project.likes));
  const [comments, setComments] = useState<string>(
    initialStatString(project.comments)
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") requestDismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestDismiss]);

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
      updatedStatsRef.current = { views: v, likes: l, comments: c };
      showToast(t("statsModal.updated"), "success");
      forceDismiss();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div
        className="absolute inset-0 ui-modal-backdrop"
        onClick={requestDismiss}
      />

      <MotionBlock
        ref={panelRef}
        preset="panel"
        aria-hidden={isDismissing}
        data-motion-state={isDismissing ? "exiting" : "entered"}
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
            onClick={requestDismiss}
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
          <Input
            id="stats-views"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            label={t("statsModal.views")}
            labelClassName="text-[10px] mb-2"
            value={views}
            onChange={(e) => setViews(sanitizeDigits(e.target.value))}
            placeholder="0"
            size="sm"
            className="text-sm"
            autoFocus
          />

          <Input
            id="stats-likes"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            label={t("statsModal.likes")}
            labelClassName="text-[10px] mb-2"
            value={likes}
            onChange={(e) => setLikes(sanitizeDigits(e.target.value))}
            placeholder="0"
            size="sm"
            className="text-sm"
          />

          <Input
            id="stats-comments"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            label={t("statsModal.comments")}
            labelClassName="text-[10px] mb-2"
            value={comments}
            onChange={(e) => setComments(sanitizeDigits(e.target.value))}
            placeholder="0"
            size="sm"
            className="text-sm"
          />
        </form>

        <div className="flex flex-col md:flex-row md:justify-end gap-3 md:gap-4 mt-8 w-full">
          <Button
            type="button"
            onClick={requestDismiss}
            disabled={isPending}
            variant="outline"
            className="px-4 py-2"
          >
            {t("statsModal.cancel")}
          </Button>
          <Button
            type="submit"
            form="stats-form"
            disabled={isPending}
            className={isPending ? "px-6 py-2 cursor-wait" : "px-6 py-2"}
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            {isPending ? t("statsModal.saving") : t("statsModal.saveStats")}
          </Button>
        </div>
      </MotionBlock>
    </div>
  );
}
