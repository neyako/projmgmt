"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { initializeStudio } from "./actions";
import { useT } from "@/lib/i18n/client";
import { Wordmark } from "@/components/brand/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
          <Input
            id="workspaceName"
            name="workspaceName"
            type="text"
            label={t("setup.workspaceId")}
            placeholder={t("setup.workspaceIdPlaceholder")}
            autoComplete="off"
            required
          />

          <Input
            id="username"
            name="username"
            type="text"
            label={t("setup.adminUsername")}
            placeholder={t("setup.adminUsernamePlaceholder")}
            autoComplete="username"
            required
          />

          <Input
            id="displayName"
            name="displayName"
            type="text"
            label={t("setup.displayName")}
            placeholder={t("setup.displayNamePlaceholder")}
            autoComplete="name"
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            label={t("setup.accessKey")}
            placeholder={t("setup.passwordPlaceholder")}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label={t("setup.confirmAccessKey")}
            placeholder={t("setup.passwordPlaceholder")}
            autoComplete="new-password"
            minLength={8}
            required
          />

          {errorMessage ? (
            <p className="text-style-label text-error tracking-widest text-center">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col items-center pt-md">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="min-w-[240px]"
            >
              {isSubmitting ? t("setup.initializing") : t("setup.initialize")}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
