"use client";

import { useState, useEffect } from "react";
import type { User } from "@prisma/client";
import TeamMemberModal from "@/components/modals/TeamMemberModal";
import { useRouter } from "next/navigation";

export default function TeamClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
    setSelectedId(null);
  }, [initialUsers]);

  const selectedUser = selectedId ? users.find(u => u.id === selectedId) ?? null : null;

  function handleOpenNew() {
    setSelectedId(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(id: string) {
    setSelectedId(id);
    setIsModalOpen(true);
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <>
      <div className="h-full w-full overflow-auto p-lg">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="ui-page-kicker mb-1">Roster</h1>
            <div className="ui-page-title text-xl md:text-2xl">Team Members</div>
            <div className="ui-page-meta mt-1">
              {users.length} {users.length === 1 ? "member" : "members"} active
            </div>
          </div>
          <button
            onClick={handleOpenNew}
            className="ui-button-outline px-6 py-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[14px] mr-2">add</span>
            NEW MEMBER
          </button>
        </div>

        {users.length === 0 ? (
          <div className="ui-panel p-12 text-center">
            <div className="ui-page-kicker">No Team Members Found</div>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleOpenEdit(u.id)}
                  className="ui-panel p-4 text-left flex flex-col gap-2"
                >
                  <div className="text-sm font-bold font-mono text-text-display uppercase tracking-wider break-words">
                    {u.name}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border-visible pt-3 mt-1">
                    <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                      {u.role.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary break-all text-right">
                      {u.email}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="ui-table-head p-4">Name</th>
                  <th className="ui-table-head p-4">Role</th>
                  <th className="ui-table-head p-4">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenEdit(u.id)}
                    className="ui-table-row cursor-pointer"
                  >
                    <td className="p-4 ui-table-cell font-bold">{u.name}</td>
                    <td className="p-4 ui-table-cell">{u.role.replace("_", " ")}</td>
                    <td className="p-4 ui-table-cell-muted">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {isModalOpen && (
        <TeamMemberModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
}
