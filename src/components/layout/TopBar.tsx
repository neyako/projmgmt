"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sun, Moon, Settings, LogOut, Plus } from "lucide-react";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") || "";
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (!isMenuOpen) {
      return;
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

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
    router.refresh();
  }

  function handleToggleMenu() {
    setIsMenuOpen((prev) => !prev);
  }

  async function handleSignOut() {
    setIsMenuOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <header className="hidden md:flex shrink-0 items-center justify-between px-6 h-16 w-full border-b border-border bg-background z-40">
        <div className="flex items-center gap-md">
          <div className="hidden lg:flex items-center border-b border-border-visible px-2 py-1 gap-2">
            <span className="material-symbols-outlined text-[16px] text-text-secondary">
              search
            </span>
            <input
              type="text"
              value={currentSearch}
              onChange={handleSearchChange}
              placeholder="SEARCH PROJECTS"
              className="bg-transparent border-none text-text-display font-mono text-xs focus:outline-none placeholder:text-text-disabled w-48 p-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-md">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-8 box-border bg-text-display text-text-inverse text-[9px] font-mono tracking-widest uppercase px-4 hover:opacity-80 transition-opacity flex items-center justify-center gap-2 leading-none"
          >
            <Plus className="w-3 h-3 shrink-0" strokeWidth={1.25} />
            NEW PROJECT
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={handleToggleMenu}
              className="w-8 h-8 bg-surface border border-border flex items-center justify-center hover:bg-surface-raised transition-colors overflow-hidden"
              aria-label="Open user menu"
              aria-expanded={isMenuOpen}
            >
              {session?.user?.avatarUrl ? (
                <Image
                  src={session.user.avatarUrl}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-cover"
                  unoptimized
                />
              ) : (
                <span className="material-symbols-outlined text-[16px] text-text-secondary">
                  person
                </span>
              )}
            </button>

            {isMenuOpen ? (
              <div className="ui-user-dropdown absolute right-0 top-full mt-2 z-50 w-56 border border-border-visible text-xs font-mono">
                <div className="px-4 py-3 border-b border-border-visible">
                  <div className="ui-user-dropdown-heading font-bold tracking-widest truncate whitespace-nowrap">
                    {session?.user?.username || session?.user?.name || "GUEST"}
                  </div>
                </div>

                <div className="border-b border-border-visible">
                  <Link
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="ui-user-dropdown-row flex items-center gap-3 w-full px-4 py-3 text-left transition-colors whitespace-nowrap tracking-widest"
                  >
                    <Settings className="w-4 h-4" />
                    <span>SETTINGS</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                    className="ui-user-dropdown-row group flex items-center justify-between w-full px-4 py-3 text-left transition-colors whitespace-nowrap cursor-pointer tracking-widest"
                  >
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span>{isDarkMode ? "DARK MODE" : "LIGHT MODE"}</span>
                    </div>
                    <span className="ui-user-dropdown-toggle transition-colors">
                      [{isDarkMode ? "LIGHT" : "DARK"}]
                    </span>
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="ui-user-dropdown-row flex items-center gap-3 w-full px-4 py-3 text-left transition-colors whitespace-nowrap tracking-widest"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>LOG OUT</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
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
