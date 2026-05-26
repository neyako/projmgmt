"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/actions/auth";
import Input from "@/components/ui/Input";
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
      <Input
        type="password"
        label={t("settings.currentPassword")}
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        size="sm"
        autoComplete="current-password"
      />

      <Input
        type="password"
        label={t("settings.newPassword")}
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        size="sm"
        autoComplete="new-password"
      />

      <Input
        type="password"
        label={t("settings.confirmNewPassword")}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        size="sm"
        autoComplete="new-password"
      />

    </form>
  );
}
