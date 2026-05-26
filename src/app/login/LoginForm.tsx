"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useT, useLocale } from "@/lib/i18n/client";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
            <Input
              id="username"
              name="username"
              type="text"
              label={t("login.username")}
              placeholder={t("login.identifier")}
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label={t("login.accessKey")}
              placeholder={t("login.passwordPlaceholder")}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {errorMessage ? (
            <p className="text-style-label text-error tracking-widest text-center">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col items-center pt-md">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              pill
              className="min-w-[160px]"
            >
              {isSubmitting ? t("login.verifying") : t("login.login")}
            </Button>
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
