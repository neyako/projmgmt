"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { publishProject } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";
import { useT } from "@/lib/i18n/client";

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
  "w-full bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none font-mono text-sm text-text-display py-2 px-0 transition-colors placeholder:text-text-disabled";

export default function PublishModal({
  project,
  onClose,
  onPublished,
}: PublishModalProps) {
  const { showToast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const isShort = project.format === "Short_Form";
  const isLong = project.format === "Long_Form";

  const [finalTitle, setFinalTitle] = useState(project.title);
  const [publishDate, setPublishDate] = useState(todayInputValue());

  const [baseCaption, setBaseCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  const [abTitles, setAbTitles] = useState<string[]>(["", "", ""]);
  const [thumbnails, setThumbnails] = useState<string[]>(["", "", ""]);

  const [youtubeId, setYoutubeId] = useState("");
  const [metaId, setMetaId] = useState("");
  const [tiktokId, setTiktokId] = useState("");

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
      showToast(t("publishModal.titleRequired"), "error");
      return;
    }
    startTransition(async () => {
      const result = await publishProject(project.id, {
        finalTitle: trimmedTitle,
        publishedAt: publishDate || null,
        youtubeId: youtubeId.trim() || undefined,
        metaId: metaId.trim() || undefined,
        tiktokId: tiktokId.trim() || undefined,
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
      showToast(t("publishModal.publishedToast", { title: trimmedTitle }), "success");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div
        className="absolute inset-0 ui-modal-backdrop"
        onClick={() => !isPending && onClose()}
      />

      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[48rem] ui-panel flex flex-col md:max-h-[90vh] motion-panel-in">

        <div className="flex justify-between items-start p-4 md:p-6 border-b border-border-visible shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                {t("publishModal.id")} {project.id.slice(0, 8)}
              </span>
              <span className="ui-tag-muted px-2 py-1">
                {t(`stageDisplay.${project.status}`)}
              </span>
              <span className="ui-tag-muted px-2 py-1">
                {t(`format.${project.format}`)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text-display uppercase tracking-widest">
              {t("publishModal.checklist")}
            </h2>
            <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-2">
              {t("publishModal.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-text-secondary hover:text-text-display font-mono text-xs transition-colors ml-4 shrink-0"
          >
            {t("publishModal.close")}
          </button>
        </div>

        <form
          id="publish-form"
          onSubmit={handleConfirm}
          className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6"
        >
          <div>
            <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
              {t("publishModal.finalTitle")}
              <span className="text-accent ml-1">*</span>
            </label>
            <input
              type="text"
              value={finalTitle}
              onChange={(e) => setFinalTitle(e.target.value)}
              placeholder={t("publishModal.finalTitlePlaceholder")}
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          {isShort && (
            <>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                  {t("publishModal.baseCaption")}
                </label>
                <textarea
                  value={baseCaption}
                  onChange={(e) => setBaseCaption(e.target.value)}
                  placeholder={t("publishModal.baseCaptionPlaceholder")}
                  className={cn(
                    INPUT_CLASS,
                    "min-h-[96px] resize-y"
                  )}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                  {t("publishModal.hashtags")}
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder={t("publishModal.hashtagsPlaceholder")}
                  className={INPUT_CLASS}
                />
                <p className="text-[10px] font-mono text-text-disabled mt-2">
                  {t("publishModal.hashtagsHint")}
                </p>
              </div>
            </>
          )}

          {isLong && (
            <>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                  {t("publishModal.abTitles")}
                </label>
                <div className="flex flex-col gap-3">
                  {abTitles.map((value, i) => (
                    <input
                      key={`ab-${i}`}
                      type="text"
                      value={value}
                      onChange={(e) => updateArrayAt(setAbTitles, i, e.target.value)}
                      placeholder={t("publishModal.titleN", { n: i + 1 })}
                      className={INPUT_CLASS}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                  {t("publishModal.thumbnails")}
                </label>
                <div className="flex flex-col gap-3">
                  {thumbnails.map((value, i) => (
                    <input
                      key={`thumb-${i}`}
                      type="text"
                      value={value}
                      onChange={(e) => updateArrayAt(setThumbnails, i, e.target.value)}
                      placeholder={t("publishModal.thumbnailPlaceholder", { n: i + 1 })}
                      className={INPUT_CLASS}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
              {t("publishModal.youtubeId")}
            </label>
            <input
              type="text"
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              placeholder="dQw4w9WgXcQ"
              autoComplete="off"
              className={INPUT_CLASS}
            />
            <p className="text-[10px] font-mono text-text-disabled mt-2">
              {t("publishModal.youtubeIdHint")}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
              {t("publishModal.metaId")}
            </label>
            <input
              type="text"
              value={metaId}
              onChange={(e) => setMetaId(e.target.value)}
              placeholder="17841400000000000"
              autoComplete="off"
              className={INPUT_CLASS}
            />
            <p className="text-[10px] font-mono text-text-disabled mt-2">
              {t("publishModal.metaIdHint")}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
              {t("publishModal.tiktokId")}
            </label>
            <input
              type="text"
              value={tiktokId}
              onChange={(e) => setTiktokId(e.target.value)}
              placeholder="7234567890123456789"
              autoComplete="off"
              className={INPUT_CLASS}
            />
            <p className="text-[10px] font-mono text-text-disabled mt-2">
              {t("publishModal.tiktokIdHint")}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
              {t("publishModal.publishDate")}
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

        <div className="flex flex-col md:flex-row md:justify-end gap-3 p-4 md:p-6 border-t border-border-visible shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="ui-button-outline px-4 py-2 disabled:opacity-50"
          >
            {t("publishModal.cancel")}
          </button>
          <button
            type="submit"
            form="publish-form"
            disabled={isPending}
            className={cn(
              "ui-button-primary px-6 py-2 flex items-center justify-center gap-2",
              isPending && "opacity-50 cursor-wait"
            )}
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            {isPending ? t("publishModal.publishing") : t("publishModal.confirmPublish")}
          </button>
        </div>
      </div>
    </div>
  );
}
