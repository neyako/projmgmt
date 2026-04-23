"use client";

import { useState } from "react";

export default function TopBar() {
  const [search, setSearch] = useState("");

  return (
    <header className="shrink-0 flex items-center justify-between px-6 h-16 w-full border-b border-white/10 bg-black z-40">
      {/* Left: Brand + Search */}
      <div className="flex items-center gap-md">
        <div className="font-[family-name:var(--font-label)] text-lg font-bold tracking-widest text-text-display">
          STUDIO_OS
        </div>
        <div className="hidden lg:flex items-center border-b border-border-visible px-2 py-1 gap-2 ml-lg">
          <span className="material-symbols-outlined text-[16px] text-text-secondary">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PROJECTS"
            className="bg-transparent border-none text-text-primary focus:outline-none text-style-label placeholder:text-text-disabled w-48 p-0"
          />
        </div>
      </div>

      {/* Right: Action + Avatar */}
      <div className="flex items-center gap-md">
        <button className="bg-text-display text-black text-style-label px-md py-sm rounded-full hover:bg-text-primary transition-colors duration-200 active:opacity-80">
          NEW PROJECT
        </button>
        <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-border-visible flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-text-secondary">
            person
          </span>
        </div>
      </div>
    </header>
  );
}
