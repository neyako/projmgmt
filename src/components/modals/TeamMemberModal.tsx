"use client";

import { useState, useTransition, useEffect } from "react";
import { createUser, updateUser, deleteUser } from "@/actions/team";
import { useToast } from "@/components/ui/Toast";
import type { User } from "@prisma/client";
import { ROLES } from "@/lib/constants";

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
  const [role, setRole] = useState(user?.role || "Talent");

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
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-[#0a0a0a] border-l border-white/10 z-[9999] p-6 flex flex-col shadow-2xl">
        <div className="flex justify-between items-start pb-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            {isEditing ? "EDIT MEMBER" : "NEW MEMBER"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white font-mono text-xs transition-colors">
            [ X ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="team-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div>
              <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white font-mono text-xs p-2 focus:outline-none focus:border-white/50 transition-colors"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white font-mono text-xs p-2 focus:outline-none focus:border-white/50 transition-colors"
                placeholder="e.g. jane@studio.com"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-3 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white font-mono text-xs p-2 focus:outline-none focus:border-white/50 transition-colors appearance-none"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
            </div>

          </form>
        </div>

        <div className="flex justify-between p-6 border-t border-white/10 shrink-0">
          {isEditing ? (
            <button type="button" onClick={handleDelete} disabled={isPending} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-red-500 border border-red-900/50 hover:bg-red-950/30 transition-colors">
              DELETE
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 border border-white/10 hover:border-gray-600 transition-colors">
              CANCEL
            </button>
            <button type="submit" form="team-form" disabled={isPending} className="px-6 py-2 text-[10px] font-mono uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
              {isPending ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}