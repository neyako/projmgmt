"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";

const themeOptions = [
  { label: "LIGHT", value: "light" },
  { label: "DARK", value: "dark" },
  { label: "AUTO", value: "system" },
] as const;

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") || "";
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

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
      <header className="shrink-0 flex items-center justify-between px-6 h-16 w-full border-b border-border bg-background z-40">
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
            className="bg-text-display text-text-inverse text-[10px] font-mono tracking-widest uppercase px-6 py-2 hover:opacity-80 transition-opacity"
          >
            NEW PROJECT
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={handleToggleMenu}
              className="w-8 h-8 bg-surface border border-border flex items-center justify-center hover:bg-surface-raised transition-colors"
              aria-label="Open user menu"
              aria-expanded={isMenuOpen}
            >
              <span className="material-symbols-outlined text-[16px] text-text-secondary">
                person
              </span>
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 border border-border-visible bg-surface text-text-secondary font-mono text-xs">
                <div className="px-3 py-3 border-b border-border-visible">
                  <div className="text-text-display font-bold tracking-widest truncate">
                    {session?.user?.username || session?.user?.name || "GUEST"}
                  </div>
                </div>

                <div className="flex flex-col py-1 border-b border-border-visible">
                  <Link
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 hover:text-text-display transition-colors tracking-widest"
                  >
                    [ SETTINGS ]
                  </Link>
                </div>

                <div className="px-3 py-3 border-b border-border-visible flex flex-col gap-2">
                  <div className="text-[10px] tracking-widest text-text-secondary">THEME</div>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions.map((option) => {
                      const isActive = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            "px-2 py-1 border text-[10px] tracking-widest transition-colors",
                            isActive
                              ? "border-text-display text-text-display"
                              : "border-border-visible text-text-disabled hover:text-text-display hover:border-outline-variant"
                          )}
                        >
                          [ {option.label} ]
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 tracking-widest transition-colors hover:text-danger-hover"
                  >
                    [ LOG OUT ]
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
