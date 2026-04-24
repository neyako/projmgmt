"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/actions/auth";
import { useToast } from "@/components/ui/Toast";

export default function ChangePasswordForm() {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
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
      showToast("Password updated.", "success");
    });
  }

  return (
    <form id="change-password-form" onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          CURRENT PASSWORD
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
          NEW PASSWORD
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
          CONFIRM NEW PASSWORD
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
