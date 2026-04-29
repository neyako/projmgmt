"use client";

import { useState, useTransition, useEffect } from "react";
import { createUser, updateUser, deleteUser, resetUserCredentials } from "@/actions/team";
import CopyBlock from "@/components/ui/CopyBlock";
import { useToast } from "@/components/ui/Toast";
import { USER_ROLES } from "@/lib/roles";
import type { CredentialHandoff, TeamUser } from "@/types";
import { useT } from "@/lib/i18n/client";

interface TeamMemberModalProps {
  user: TeamUser | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function TeamMemberModal({ user, onClose, onRefresh }: TeamMemberModalProps) {
  const { showToast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "MEMBER");
  const [credentialHandoff, setCredentialHandoff] = useState<CredentialHandoff | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setRole(user?.role || "MEMBER");
    setCredentialHandoff(null);
  }, [user?.id]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast(t("teamModal.nameEmailRequired"), "error");
      return;
    }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        email: email.trim(),
        role,
      };

      if (isEditing) {
        const result = await updateUser(user.id, data);
        if (result.success) {
          showToast(t("teamModal.memberUpdated"), "success");
          onRefresh();
          onClose();
        } else {
          showToast(result.error || t("teamModal.failedSave"), "error");
        }
        return;
      }

      const result = await createUser(data);
      if (result.success) {
        setCredentialHandoff(result.data.credentials);
        showToast(t("teamModal.memberAdded"), "success");
        onRefresh();
      } else {
        showToast(result.error || t("teamModal.failedSave"), "error");
      }
    });
  }

  function handleDelete() {
    if (!user || !confirm(t("teamModal.confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.success) {
        showToast(t("teamModal.memberDeleted"), "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || t("teamModal.failedDelete"), "error");
      }
    });
  }

  function handleResetCredentials() {
    if (!user) return;

    const confirmed = confirm(
      user.hasLogin ? t("teamModal.confirmReset") : t("teamModal.confirmCreateLogin")
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await resetUserCredentials(user.id);

      if (result.success) {
        setCredentialHandoff(result.data.credentials);
        showToast(t("teamModal.credentialsGenerated"), "success");
        onRefresh();
      } else {
        showToast(result.error || t("teamModal.failedReset"), "error");
      }
    });
  }

  const credentialCopy = credentialHandoff
    ? [
        `Email: ${credentialHandoff.email}`,
        `Username: ${credentialHandoff.username}`,
        `Temporary password: ${credentialHandoff.temporaryPassword}`,
        "Login URL: /login",
      ].join("\n")
    : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div className="absolute inset-0 ui-modal-backdrop" onClick={onClose} />

      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[28rem] ui-modal-shell p-4 md:p-6 flex flex-col md:max-h-[90vh]">
        <div className="flex justify-between items-start pb-6 border-b border-border-visible shrink-0">
          <h2 className="text-xl font-bold text-text-display uppercase tracking-wider">
            {isEditing ? t("teamModal.edit") : t("teamModal.new")}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-display font-mono text-xs transition-colors">
            {t("teamModal.close")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 md:p-6">
          <form id="team-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {credentialHandoff && (
              <div className="flex flex-col gap-4">
                <div className="border border-success/40 bg-success/5 p-4">
                  <div className="text-[10px] font-mono tracking-widest text-success uppercase">
                    {t("teamModal.oneTimeLogin")}
                  </div>
                  <div className="mt-2 text-xs font-mono text-text-secondary">
                    {t("teamModal.emailPending")}
                  </div>
                </div>

                <CopyBlock label={t("teamModal.loginHandoff")} copyValue={credentialCopy}>
                  <div className="grid gap-2 text-xs">
                    <div>
                      <span className="text-text-secondary uppercase tracking-widest">{t("teamModal.emailLabel")} </span>
                      <span className="text-text-display break-all">{credentialHandoff.email}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary uppercase tracking-widest">{t("teamModal.usernameLabel")} </span>
                      <span className="text-text-display break-all">{credentialHandoff.username}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary uppercase tracking-widest">{t("teamModal.tempPasswordLabel")} </span>
                      <span className="text-text-display break-all">{credentialHandoff.temporaryPassword}</span>
                    </div>
                  </div>
                </CopyBlock>

                <CopyBlock
                  label={t("teamModal.emailDraft")}
                  copyValue={`To: ${credentialHandoff.email}\nSubject: ${credentialHandoff.emailSubject}\n\n${credentialHandoff.emailBody}`}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("teamModal.fullName")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full ui-input p-2"
                placeholder={t("teamModal.fullNamePlaceholder")}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("teamModal.emailAddress")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ui-input p-2 color-scheme-dark"
                placeholder={t("teamModal.emailPlaceholder")}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("teamModal.role")}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full ui-input p-2 appearance-none"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`role.${r}`)}
                  </option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div className="border-t border-border-visible pt-6">
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-2">
                      {t("teamModal.loginCredentials")}
                    </div>
                    <div className={user?.hasLogin ? "text-xs font-mono text-success break-all" : "text-xs font-mono text-warning"}>
                      {user?.hasLogin ? user.username : t("teamModal.noLoginConfigured")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCredentials}
                    disabled={isPending}
                    className="ui-button-outline px-4 py-2 w-full disabled:opacity-50"
                  >
                    {user?.hasLogin ? t("teamModal.resetLogin") : t("teamModal.createLogin")}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-3 pt-4 md:p-6 border-t border-border-visible shrink-0">
          {isEditing ? (
            <button type="button" onClick={handleDelete} disabled={isPending} className="ui-button-danger px-4 py-2">
              {t("teamModal.delete")}
            </button>
          ) : (
            <div />
          )}
          <div className="flex flex-col md:flex-row gap-3 md:ml-auto">
            <button type="button" onClick={onClose} className="ui-button-outline px-4 py-2">
              {t("teamModal.cancel")}
            </button>
            <button
              type="submit"
              form="team-form"
              disabled={isPending || (!isEditing && !!credentialHandoff)}
              className="ui-button-primary px-6 py-2 disabled:opacity-50"
            >
              {isPending ? t("teamModal.saving") : t("teamModal.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
