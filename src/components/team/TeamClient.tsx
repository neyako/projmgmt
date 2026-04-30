"use client";

import { useState, useEffect } from "react";
import TeamMemberModal from "@/components/modals/TeamMemberModal";
import { useRouter } from "next/navigation";
import type { TeamUser } from "@/types";
import { useT } from "@/lib/i18n/client";

export default function TeamClient({ initialUsers }: { initialUsers: TeamUser[] }) {
  const router = useRouter();
  const t = useT();
  const [users, setUsers] = useState(initialUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setUsers(initialUsers);
    setSelectedId((currentId) =>
      currentId && initialUsers.some((user) => user.id === currentId) ? currentId : null
    );
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
            <h1 className="ui-page-kicker mb-1">{t("team.title")}</h1>
            <div className="ui-page-title text-xl md:text-2xl">{t("team.members")}</div>
            <div className="ui-page-meta mt-1">
              {users.length} {users.length === 1 ? t("team.memberSingular") : t("team.memberPlural")} {t("team.active")}
            </div>
          </div>
          <button
            onClick={handleOpenNew}
            className="ui-button-outline px-6 py-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[14px] mr-2">add</span>
            {t("team.newMember")}
          </button>
        </div>

        {users.length === 0 ? (
          <div className="ui-panel p-12 text-center">
            <div className="ui-page-kicker">{t("team.noMembers")}</div>
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
                      {t(`role.${u.role}`)}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary break-all text-right">
                      {u.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                      {t("team.loginColumn")}
                    </span>
                    <span className={u.hasLogin ? "text-[10px] font-mono text-success" : "text-[10px] font-mono text-warning"}>
                      {u.hasLogin ? u.username : t("team.noCred")}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block bg-surface-raised border border-border-visible overflow-x-auto">
              <table className="w-full text-left border-collapse bg-surface-raised">
                <thead>
                  <tr>
                    <th className="ui-table-head p-4">{t("team.name")}</th>
                    <th className="ui-table-head p-4">{t("team.role")}</th>
                    <th className="ui-table-head p-4">{t("team.email")}</th>
                    <th className="ui-table-head p-4">{t("team.loginColumn")}</th>
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
                      <td className="p-4 ui-table-cell">{t(`role.${u.role}`)}</td>
                      <td className="p-4 ui-table-cell-muted">{u.email}</td>
                      <td className="p-4 ui-table-cell">
                        <span className={u.hasLogin ? "text-success" : "text-warning"}>
                          {u.hasLogin ? u.username : t("team.noCred")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
