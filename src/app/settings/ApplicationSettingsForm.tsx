"use client";

import { useState, useTransition } from "react";
import { saveApplicationSettings } from "@/actions/settings";
import {
  normalizeContentTypeValue,
  type ApplicationSettings,
  type ContentTypeOption,
} from "@/lib/appSettingsConfig";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

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
  const [publicUrl, setPublicUrl] = useState(initialSettings.publicUrl);
  const [rows, setRows] = useState<Row[]>(() => toRows(initialSettings.contentTypes));

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
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          {t("settings.publicUrl")}
        </label>
        <input
          type="text"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          placeholder={t("settings.publicUrlPlaceholder")}
          className="bg-transparent border-0 border-b border-border-visible focus:outline-none focus:border-text-display px-0 py-2 text-xs font-mono text-text-display w-full color-scheme-dark"
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
          <button
            type="button"
            onClick={addRow}
            className="ui-button-outline px-4 py-2 shrink-0"
          >
            {t("settings.addContentType")}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.localId}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border border-border-visible bg-input-surface p-3 motion-panel-in"
            >
              <label className="flex flex-col gap-2 min-w-0">
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                  {t("settings.contentTypeValue")}
                </span>
                <input
                  value={row.value}
                  onChange={(e) => updateRow(row.localId, { value: e.target.value })}
                  className="ui-input px-2 py-2 w-full"
                  placeholder="Custom_Type"
                />
              </label>

              <label className="flex flex-col gap-2 min-w-0">
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                  {t("settings.contentTypeEnglish")}
                </span>
                <input
                  value={row.labelEn}
                  onChange={(e) => updateRow(row.localId, { labelEn: e.target.value })}
                  className="ui-input px-2 py-2 w-full"
                  placeholder="Custom"
                />
              </label>

              <label className="flex flex-col gap-2 min-w-0">
                <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                  {t("settings.contentTypeVietnamese")}
                </span>
                <input
                  value={row.labelVi}
                  onChange={(e) => updateRow(row.localId, { labelVi: e.target.value })}
                  className="ui-input px-2 py-2 w-full"
                  placeholder="Tùy chỉnh"
                />
              </label>

              <button
                type="button"
                onClick={() => removeRow(row.localId)}
                disabled={rows.length <= 1}
                className="ui-button-danger px-3 py-2 md:self-end disabled:opacity-40 disabled:pointer-events-none"
              >
                {t("settings.removeContentType")}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="ui-button-primary px-6 py-2 disabled:opacity-50"
        >
          {isPending ? t("settings.savingApplication") : t("settings.saveApplication")}
        </button>
      </div>
    </form>
  );
}
