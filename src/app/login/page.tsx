"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
      setErrorMessage("INVALID_CREDENTIALS");
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
          <h1 className="text-style-display-xl text-text-display tracking-tighter">projmgmt</h1>
          <div className="flex items-center gap-sm opacity-50">
            <span className="block w-md h-2xs bg-border-visible" />
            <span className="text-style-label text-text-secondary tracking-widest">SYS_AUTH</span>
            <span className="block w-md h-2xs bg-border-visible" />
          </div>
        </header>

        <form className="w-full flex flex-col gap-2xl" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-xl">
            <div className="flex flex-col gap-sm group">
              <label
                htmlFor="username"
                className="text-style-label text-text-secondary group-focus-within:text-text-display transition-colors"
              >
                USERNAME
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="IDENTIFIER"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display transition-colors"
              />
            </div>

            <div className="flex flex-col gap-sm group">
              <label
                htmlFor="password"
                className="text-style-label text-text-secondary group-focus-within:text-text-display transition-colors"
              >
                ACCESS_KEY
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display transition-colors"
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="text-style-label text-red-500 tracking-widest text-center">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col items-center pt-md">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-text-display text-text-inverse text-style-label rounded-full px-xl py-md min-w-[160px] hover:opacity-80 transition-opacity active:scale-95 duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "VERIFYING..." : "LOGIN"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
