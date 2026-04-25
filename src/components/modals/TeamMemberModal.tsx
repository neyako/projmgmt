"use client";

import { useState, useTransition, useEffect } from "react";
import { createUser, updateUser, deleteUser } from "@/actions/team";
import { useToast } from "@/components/ui/Toast";
import type { User } from "@prisma/client";
import { USER_ROLES } from "@/lib/roles";

interface TeamMemberModalProps {
  user: User | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function TeamMemberModal({ user, onClose, onRefresh }: TeamMemberModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "MEMBER");

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
      showToast("Name and Email are required.", "error");
      return;
    }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        email: email.trim(),
        role,
      };

      let result;
      if (isEditing) {
        result = await updateUser(user.id, data);
      } else {
        result = await createUser(data);
      }

      if (result.success) {
        showToast(`Member ${isEditing ? "updated" : "added"}.`, "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || "Failed to save.", "error");
      }
    });
  }

  function handleDelete() {
    if (!user || !confirm("Delete this team member?")) return;
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.success) {
        showToast("Member deleted.", "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || "Failed to delete.", "error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div className="absolute inset-0 ui-modal-backdrop" onClick={onClose} />

      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[28rem] ui-modal-shell p-4 md:p-6 flex flex-col md:max-h-[90vh]">
        <div className="flex justify-between items-start pb-6 border-b border-border-visible shrink-0">
          <h2 className="text-xl font-bold text-text-display uppercase tracking-wider">
            {isEditing ? "EDIT MEMBER" : "NEW MEMBER"}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-display font-mono text-xs transition-colors">
            [ X ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 md:p-6">
          <form id="team-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full ui-input p-2 w-full"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ui-input p-2 w-full"
                placeholder="e.g. jane@studio.com"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full ui-input p-2 w-full appearance-none"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

          </form>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-3 pt-4 md:p-6 border-t border-border-visible shrink-0">
          {isEditing ? (
            <button type="button" onClick={handleDelete} disabled={isPending} className="ui-button-danger px-4 py-2">
              DELETE
            </button>
          ) : (
            <div />
          )}
          <div className="flex flex-col md:flex-row gap-3 md:ml-auto">
            <button type="button" onClick={onClose} className="ui-button-outline px-4 py-2">
              CANCEL
            </button>
            <button type="submit" form="team-form" disabled={isPending} className="ui-button-primary px-6 py-2 disabled:opacity-50">
              {isPending ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
