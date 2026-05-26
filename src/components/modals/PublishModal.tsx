"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { publishProject } from "@/actions/projects";
import Button from "@/components/ui/Button";
import { inputStyles } from "@/components/ui/controlStyles";
import { useToast } from "@/components/ui/Toast";
import CopyBlock from "@/components/ui/CopyBlock";
import type { ProjectCardData } from "@/types";
import { useT } from "@/lib/i18n/client";

interface PublishModalProps {
  project: ProjectCardData;
  frequentHashtags: string[];
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
  inputStyles({ variant: "underline", size: "sm", className: "text-sm py-2" });

function hashtagTokens(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((token) => token.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

function normalizeHashtags(raw: string): string {
  return hashtagTokens(raw)
    .map((token) => `#${token}`)
    .join(" ");
}

export default function PublishModal({
  project,
  frequentHashtags,
  onClose,
  onPublished,
}: PublishModalProps) {
  const { showToast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const isShort = project.format === "Short_Form";
  const isLong = project.format === "Long_Form";
  const [step, setStep] = useState<"metadata" | "links">("metadata");

  const [finalTitle, setFinalTitle] = useState(project.title);
  const [publishDate, setPublishDate] = useState(todayInputValue());

  const [baseCaption, setBaseCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  const [abTitles, setAbTitles] = useState<string[]>(["", "", ""]);
  const [thumbnails, setThumbnails] = useState<string[]>(["", "", ""]);

  const [youtubeId, setYoutubeId] = useState("");
  const [metaId, setMetaId] = useState("");
  const [tiktokId, setTiktokId] = useState("");

  const trimmedTitle = finalTitle.trim();
  const baseCaptionCopy = baseCaption.trim();
  const normalizedHashtagLine = normalizeHashtags(hashtags);
  const captionWithHashtagsCopy = [baseCaptionCopy, normalizedHashtagLine]
    .filter(Boolean)
    .join("\n\n");
  const abTitleCopy = abTitles
    .map((title) => title.trim())
    .filter(Boolean)
    .join("\n");
  const thumbnailCopy = thumbnails
    .map((thumbnail) => thumbnail.trim())
    .filter(Boolean)
    .join("\n");

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
    value: string,
  ) {
    setter((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addFrequentHashtag(tag: string) {
    setHashtags((prev) => {
      const nextTag = tag.replace(/^#+/, "");
      const tokens = hashtagTokens(prev);
      const tokenKeys = new Set(
        tokens.map((token) => token.toLocaleLowerCase()),
      );
      if (tokenKeys.has(nextTag.toLocaleLowerCase())) return prev;
      return [...tokens, nextTag].join(" ");
    });
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmedTitle) {
      showToast(t("publishModal.titleRequired"), "error");
      return;
    }
    if (step === "metadata") {
      setStep("links");
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
          baseCaption: baseCaptionCopy || undefined,
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
      showToast(
        t("publishModal.publishedToast", { title: trimmedTitle }),
        "success",
      );
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
              {step === "metadata"
                ? t("publishModal.checklist")
                : t("publishModal.postUpload")}
            </h2>
            <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-2">
              {step === "metadata"
                ? t("publishModal.subtitle")
                : t("publishModal.postUploadSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-text-secondary hover:bg-text-display hover:text-text-inverse font-mono text-xs ml-4 shrink-0 px-1"
          >
            {t("publishModal.close")}
          </button>
        </div>

        <form
          id="publish-form"
          onSubmit={handleConfirm}
          className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6"
        >
          {step === "metadata" && (
            <>
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
                      className={cn(INPUT_CLASS, "min-h-[96px] resize-y")}
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
                    {frequentHashtags.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2">
                          {t("publishModal.frequentHashtags")}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {frequentHashtags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addFrequentHashtag(tag)}
                              className="ui-tag-muted hover:bg-text-display hover:text-text-inverse hover:border-text-display"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                          onChange={(e) =>
                            updateArrayAt(setAbTitles, i, e.target.value)
                          }
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
                          onChange={(e) =>
                            updateArrayAt(setThumbnails, i, e.target.value)
                          }
                          placeholder={t("publishModal.thumbnailPlaceholder", {
                            n: i + 1,
                          })}
                          className={INPUT_CLASS}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

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
            </>
          )}

          {step === "links" && (
            <>
              <div className="flex flex-col gap-3">
                {isShort && (
                  <>
                    <CopyBlock
                      label={t("publishModal.copyCaption")}
                      copyValue={baseCaptionCopy || "—"}
                    >
                      {baseCaptionCopy || (
                        <span className="text-text-disabled italic">
                          {t("publishModal.noBaseCaption")}
                        </span>
                      )}
                    </CopyBlock>
                    <CopyBlock
                      label={t("publishModal.copyCaptionWithHashtags")}
                      copyValue={captionWithHashtagsCopy || "—"}
                    >
                      {captionWithHashtagsCopy || (
                        <span className="text-text-disabled italic">
                          {t("publishModal.noCaption")}
                        </span>
                      )}
                    </CopyBlock>
                  </>
                )}
                {isLong && (
                  <>
                    <CopyBlock
                      label={t("publishModal.copyTitle")}
                      copyValue={trimmedTitle || "—"}
                    />
                    <CopyBlock
                      label={t("publishModal.copyAbTitles")}
                      copyValue={abTitleCopy || trimmedTitle || "—"}
                    />
                    <CopyBlock
                      label={t("publishModal.copyThumbnails")}
                      copyValue={thumbnailCopy || "—"}
                    >
                      {thumbnailCopy || (
                        <span className="text-text-disabled italic">
                          {t("publishModal.noThumbnails")}
                        </span>
                      )}
                    </CopyBlock>
                  </>
                )}
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">
                  {t("publishModal.youtubeId")}
                </label>
                <input
                  type="text"
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ"
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
                  placeholder="https://facebook.com/reel/17841400000000000"
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
                  placeholder="https://tiktok.com/@account/video/7234567890123456789"
                  autoComplete="off"
                  className={INPUT_CLASS}
                />
                <p className="text-[10px] font-mono text-text-disabled mt-2">
                  {t("publishModal.tiktokIdHint")}
                </p>
              </div>
            </>
          )}
        </form>

        <div className="flex flex-col md:flex-row md:justify-end gap-3 p-4 md:p-6 border-t border-border-visible shrink-0">
          <Button
            type="button"
            onClick={() =>
              step === "metadata" ? onClose() : setStep("metadata")
            }
            disabled={isPending}
            variant="outline"
            className="px-4 py-2"
          >
            {step === "metadata"
              ? t("publishModal.cancel")
              : t("publishModal.back")}
          </Button>
          <Button
            type="submit"
            form="publish-form"
            disabled={isPending}
            className={cn(
              "px-6 py-2",
              isPending && "opacity-50 cursor-wait",
            )}
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            {isPending
              ? t("publishModal.publishing")
              : step === "metadata"
                ? t("publishModal.nextUpload")
                : t("publishModal.confirmPublish")}
          </Button>
        </div>
      </div>
    </div>
  );
}
