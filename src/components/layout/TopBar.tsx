"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") || "";

  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function handleProjectCreated() {
    setIsModalOpen(false);
    router.refresh(); // Refresh current page to see new project if applicable
  }

  return (
    <>
      <header className="shrink-0 flex items-center justify-between px-6 h-16 w-full border-b border-white/10 bg-black z-40">
        {/* Left: Search */}
        <div className="flex items-center gap-md">
          <div className="hidden lg:flex items-center border-b border-white/10 px-2 py-1 gap-2">
            <span className="material-symbols-outlined text-[16px] text-gray-500">
              search
            </span>
            <input
              type="text"
              value={currentSearch}
              onChange={handleSearchChange}
              placeholder="SEARCH PROJECTS"
              className="bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder:text-gray-600 w-48 p-0"
            />
          </div>
        </div>

        {/* Right: Action + Avatar */}
        <div className="flex items-center gap-md">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black text-[10px] font-mono tracking-widest uppercase px-6 py-2 hover:bg-gray-200 transition-colors"
          >
            NEW PROJECT
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="w-8 h-8 bg-[#0f0f0f] border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
            aria-label="Open settings"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">
              person
            </span>
          </button>
        </div>
      </header>

      {isModalOpen && (
        <ProjectDetailsModal
          project={null}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </>
  );
}
