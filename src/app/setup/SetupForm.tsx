"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { initializeStudio } from "./actions";
import { useT } from "@/lib/i18n/client";
import { Wordmark } from "@/components/brand/Logo";

export default function SetupForm() {
  const router = useRouter();
  const t = useT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await initializeStudio(formData);
      if (!result.success) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message.toUpperCase() : "INIT_FAILED");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-text-primary min-h-screen flex flex-col items-center justify-center overflow-hidden p-lg">
      <main className="w-full max-w-[28rem] border border-border-visible bg-surface p-2xl flex flex-col gap-2xl">
        <header className="flex flex-col gap-md border-b border-border-visible pb-lg">
          <Wordmark size="md" weight={900} cursorBlink />
          <h2 className="text-style-label text-text-display tracking-widest">
            {t("setup.header")}
          </h2>
          <p className="text-style-caption text-text-secondary leading-relaxed">
            {t("setup.subheader")}
          </p>
        </header>

        <form className="w-full flex flex-col gap-xl" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-sm group">
            <label
              htmlFor="workspaceName"
              className="text-style-label text-text-secondary tracking-widest group-focus-within:text-text-display"
            >
              {t("setup.workspaceId")}
            </label>
            <input
              id="workspaceName"
              name="workspaceName"
              type="text"
              placeholder={t("setup.workspaceIdPlaceholder")}
              autoComplete="off"
              required
              className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
            />
          </div>

          <div className="flex flex-col gap-sm group">
            <label
              htmlFor="username"
              className="text-style-label text-text-secondary tracking-widest group-focus-within:text-text-display"
            >
              {t("setup.adminUsername")}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder={t("setup.adminUsernamePlaceholder")}
              autoComplete="username"
              required
              className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
            />
          </div>

          <div className="flex flex-col gap-sm group">
            <label
              htmlFor="displayName"
              className="text-style-label text-text-secondary tracking-widest group-focus-within:text-text-display"
            >
              {t("setup.displayName")}
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              placeholder={t("setup.displayNamePlaceholder")}
              autoComplete="name"
              required
              className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
            />
          </div>

          <div className="flex flex-col gap-sm group">
            <label
              htmlFor="password"
              className="text-style-label text-text-secondary tracking-widest group-focus-within:text-text-display"
            >
              {t("setup.accessKey")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={t("setup.passwordPlaceholder")}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
            />
          </div>

          <div className="flex flex-col gap-sm group">
            <label
              htmlFor="confirmPassword"
              className="text-style-label text-text-secondary tracking-widest group-focus-within:text-text-display"
            >
              {t("setup.confirmAccessKey")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t("setup.passwordPlaceholder")}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
            />
          </div>

          {errorMessage ? (
            <p className="text-style-label text-error tracking-widest text-center">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col items-center pt-md">
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-text-display bg-text-display text-text-inverse text-style-label tracking-widest px-xl py-md min-w-[240px] hover:bg-background hover:text-text-display disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("setup.initializing") : t("setup.initialize")}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
