"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useT, useLocale } from "@/lib/i18n/client";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export default function LanguageForm() {
  const t = useT();
  const current = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  function selectLocale(next: Locale) {
    if (next === current || pending) return;
    startTransition(async () => {
      const res = await setLocale(next);
      if (res.ok) {
        showToast(t("settings.languageSaved"), "success");
        router.refresh();
      } else if (res.error) {
        showToast(res.error, "error");
      }
    });
  }

  const labelFor: Record<Locale, string> = {
    en: t("settings.languageEnglish"),
    vi: t("settings.languageVietnamese"),
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          {t("settings.language")}
        </label>
        <p className="text-xs font-mono text-text-secondary">
          {t("settings.languageDescription")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {LOCALES.map((code) => {
          const isActive = code === current;
          return (
            <button
              key={code}
              type="button"
              onClick={() => selectLocale(code)}
              disabled={pending}
              className={cn(
                "px-4 py-2 border text-[11px] font-mono uppercase tracking-widest disabled:opacity-50",
                isActive
                  ? "bg-text-display text-text-inverse border-text-display"
                  : "bg-transparent text-text-display border-border-visible hover:border-text-display",
              )}
            >
              {labelFor[code]} <span className="opacity-60">[{code.toUpperCase()}]</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
