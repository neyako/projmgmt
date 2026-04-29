"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/actions/auth";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

export default function ChangePasswordForm() {
  const { showToast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t("settings.passwordsRequired"), "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t("settings.passwordsMismatch"), "error");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("settings.passwordUpdated"), "success");
    });
  }

  return (
    <form id="change-password-form" onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          {t("settings.currentPassword")}
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none px-0 py-2 text-xs font-mono text-text-display w-full"
          autoComplete="current-password"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          {t("settings.newPassword")}
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none px-0 py-2 text-xs font-mono text-text-display w-full"
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          {t("settings.confirmNewPassword")}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="bg-transparent border-0 border-b border-border-visible focus:border-text-display focus:outline-none px-0 py-2 text-xs font-mono text-text-display w-full"
          autoComplete="new-password"
        />
      </div>

    </form>
  );
}
