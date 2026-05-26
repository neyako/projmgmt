"use client";

import { useRef, useState, useTransition } from "react";
import { saveApplicationSettings } from "@/actions/settings";
import {
  normalizeContentTypeValue,
  type ApplicationSettings,
  type ContentTypeOption,
} from "@/lib/appSettingsConfig";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";
import { useTerminalStagger } from "@/components/motion/TerminalMotion";

type Row = ContentTypeOption & { localId: string };

function toRows(options: ContentTypeOption[]): Row[] {
  return options.map((option) => ({
    ...option,
    localId: crypto.randomUUID(),
  }));
}

function fromRows(rows: Row[]): ContentTypeOption[] {
  return rows.map(({ value, labelEn, labelVi }) => ({
    value: normalizeContentTypeValue(value || labelEn || labelVi),
    labelEn,
    labelVi,
  }));
}

export default function ApplicationSettingsForm({
  initialSettings,
}: {
  initialSettings: ApplicationSettings;
}) {
  const t = useT();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const rowsRef = useRef<HTMLDivElement | null>(null);
  const [publicUrl, setPublicUrl] = useState(initialSettings.publicUrl);
  const [rows, setRows] = useState<Row[]>(() => toRows(initialSettings.contentTypes));
  useTerminalStagger(rowsRef, [rows.length], { stagger: 0.04 });

  function updateRow(localId: string, patch: Partial<ContentTypeOption>) {
    setRows((current) =>
      current.map((row) => (row.localId === localId ? { ...row, ...patch } : row))
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        localId: crypto.randomUUID(),
        value: "",
        labelEn: "",
        labelVi: "",
      },
    ]);
  }

  function removeRow(localId: string) {
    setRows((current) => current.filter((row) => row.localId !== localId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveApplicationSettings({
        publicUrl,
        contentTypes: fromRows(rows),
      });

      if (!result.ok || !result.settings) {
        showToast(result.error || t("settings.appSettingsFailed"), "error");
        return;
      }

      setPublicUrl(result.settings.publicUrl);
      setRows(toRows(result.settings.contentTypes));
      showToast(t("settings.appSettingsSaved"), "success");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Input
          type="text"
          label={t("settings.publicUrl")}
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          placeholder={t("settings.publicUrlPlaceholder")}
          size="sm"
        />
        <p className="text-xs font-mono text-text-secondary">
          {t("settings.publicUrlDescription")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
              {t("settings.contentTypes")}
            </div>
            <p className="mt-2 text-xs font-mono text-text-secondary">
              {t("settings.contentTypesDescription")}
            </p>
          </div>
          <Button
            type="button"
            onClick={addRow}
            variant="outline"
            className="px-4 py-2 shrink-0"
          >
            {t("settings.addContentType")}
          </Button>
        </div>

        <div ref={rowsRef} className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.localId}
              data-motion-item
              className="grid grid-cols-1 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border border-border-visible bg-input-surface p-3"
            >
              <Input
                label={t("settings.contentTypeValue")}
                value={row.value}
                onChange={(e) => updateRow(row.localId, { value: e.target.value })}
                variant="panel"
                wrapperClassName="min-w-0"
                labelClassName="text-[10px]"
                placeholder="Custom_Type"
              />

              <Input
                label={t("settings.contentTypeEnglish")}
                value={row.labelEn}
                onChange={(e) => updateRow(row.localId, { labelEn: e.target.value })}
                variant="panel"
                wrapperClassName="min-w-0"
                labelClassName="text-[10px]"
                placeholder="Custom"
              />

              <Input
                label={t("settings.contentTypeVietnamese")}
                value={row.labelVi}
                onChange={(e) => updateRow(row.localId, { labelVi: e.target.value })}
                variant="panel"
                wrapperClassName="min-w-0"
                labelClassName="text-[10px]"
                placeholder="Tùy chỉnh"
              />

              <Button
                type="button"
                onClick={() => removeRow(row.localId)}
                disabled={rows.length <= 1}
                variant="danger"
                className="px-3 py-2 md:self-end disabled:opacity-40 disabled:pointer-events-none"
              >
                {t("settings.removeContentType")}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="px-6 py-2"
        >
          {isPending ? t("settings.savingApplication") : t("settings.saveApplication")}
        </Button>
      </div>
    </form>
  );
}
