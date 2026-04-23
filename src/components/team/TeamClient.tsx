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
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Roster</h1>
            <div className="text-2xl font-bold text-white uppercase tracking-wider">Team Members</div>
            <div className="text-xs font-mono text-gray-500 mt-1">
              {users.length} {users.length === 1 ? "member" : "members"} active
            </div>
          </div>
          <button
            onClick={handleOpenNew}
            className="bg-transparent border border-white/10 text-white text-[10px] font-mono px-6 py-2 uppercase hover:bg-white/5 transition-colors tracking-widest flex items-center"
          >
            <span className="material-symbols-outlined text-[14px] mr-2">add</span>
            NEW MEMBER
          </button>
        </div>

        {users.length === 0 ? (
          <div className="border border-white/10 p-12 text-center">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">No Team Members Found</div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">Name</th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">Role</th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => handleOpenEdit(u.id)}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-sm font-mono text-gray-300 font-bold">{u.name}</td>
                  <td className="p-4 text-sm font-mono text-gray-400">{u.role.replace("_", " ")}</td>
                  <td className="p-4 text-xs font-mono text-gray-500">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
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