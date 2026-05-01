"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useT, useLocale } from "@/lib/i18n/client";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Logo";

export default function LoginForm() {
  const router = useRouter();
  const t = useT();
  const currentLocale = useLocale();

  async function handleLocaleChange(next: Locale) {
    if (next === currentLocale) return;
    await setLocale(next);
    router.refresh();
  }
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setErrorMessage(t("login.invalidCredentials"));
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="bg-background text-text-primary min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <main className="w-full max-w-[24rem] px-lg flex flex-col items-center gap-4xl">
        <header className="text-center flex flex-col items-center gap-xs">
          <Wordmark as="h1" size="xl" weight={700} cursorBlink />
          <div className="flex items-center gap-sm opacity-50">
            <span className="block w-md h-2xs bg-border-visible" />
            <span className="text-style-label text-text-secondary tracking-widest">{t("login.header")}</span>
            <span className="block w-md h-2xs bg-border-visible" />
          </div>
        </header>

        <form className="w-full flex flex-col gap-2xl" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-xl">
            <div className="flex flex-col gap-sm group">
              <label
                htmlFor="username"
                className="text-style-label text-text-secondary group-focus-within:text-text-display"
              >
                {t("login.username")}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder={t("login.identifier")}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
              />
            </div>

            <div className="flex flex-col gap-sm group">
              <label
                htmlFor="password"
                className="text-style-label text-text-secondary group-focus-within:text-text-display"
              >
                {t("login.accessKey")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display"
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="text-style-label text-error tracking-widest text-center">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col items-center pt-md">
            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-text-display bg-text-display text-text-inverse text-style-label rounded-full px-xl py-md min-w-[160px] hover:bg-background hover:text-text-display disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("login.verifying") : t("login.login")}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 opacity-70">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => handleLocaleChange(code)}
              className={cn(
                "text-style-label tracking-widest px-2 py-1",
                code === currentLocale
                  ? "text-text-display"
                  : "text-text-secondary hover:bg-text-display hover:text-text-inverse",
              )}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
