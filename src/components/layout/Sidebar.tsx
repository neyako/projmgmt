"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Settings, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const memberHiddenRoutes = new Set(["/analytics", "/sponsorships", "/team"]);

function getVisibleNavItems(role: string | undefined) {
  if (role !== "MEMBER") {
    return NAV_ITEMS;
  }

  return NAV_ITEMS.filter((item) => !memberHiddenRoutes.has(item.href));
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const visibleNavItems = getVisibleNavItems(session?.user?.role);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  function handleNewProjectClick() {
    router.push("/pipeline?new=1");
    setIsOpen(false);
  }

  async function handleSignOut() {
    setIsOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <nav className="hidden md:flex flex-col gap-2 p-3 lg:p-4 h-full fixed left-0 top-0 w-56 lg:w-64 border-r border-border bg-background z-50">
        <div className="mb-lg lg:mb-xl px-2 lg:px-3">
          <h1 className="font-[family-name:var(--font-label)] text-[32px] lg:text-[44px] font-black text-text-display tracking-tight leading-none">
            projmgmt
          </h1>
        </div>

        <div className="flex-1 flex flex-col gap-sm">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 lg:px-3 py-2 flex items-center gap-3 lg:gap-4 text-style-label tracking-widest transition-all duration-150 active:scale-95",
                  isActive
                    ? "text-text-display border border-border-visible bg-surface-raised"
                    : "text-text-disabled hover:text-text-display hover:bg-surface-raised border border-transparent"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[18px]",
                    isActive && "icon-fill"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <header className="flex md:hidden fixed top-0 inset-x-0 h-14 z-[90] items-center justify-between border-b border-border bg-background px-4 pointer-events-auto">
        <h1 className="font-[family-name:var(--font-label)] text-base font-bold text-text-display tracking-widest uppercase">
          projmgmt
        </h1>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          onPointerDown={() => setIsOpen(true)}
          className="w-11 h-10 border border-border-visible bg-background text-text-display flex items-center justify-center touch-manipulation"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-[90] md:hidden bg-background flex flex-col">
          <div className="flex items-center justify-between h-14 shrink-0 border-b border-border-visible px-4">
            <span className="text-style-label text-text-display tracking-widest">
              [ MENU ]
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              onPointerDown={() => setIsOpen(false)}
              className="w-11 h-10 border border-border-visible bg-background text-text-display flex items-center justify-center touch-manipulation"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              {visibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-4 min-h-[44px] flex items-center gap-4 text-style-label tracking-widest border",
                      isActive
                        ? "text-text-display border-border-visible bg-surface-raised"
                        : "text-text-disabled border-transparent hover:text-text-display hover:bg-surface-raised"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-[20px]",
                        isActive && "icon-fill"
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-border-visible p-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleNewProjectClick}
              className="ui-button-primary px-4 py-3 min-h-[44px] text-left"
            >
              + NEW PROJECT
            </button>
            <button
              type="button"
              onClick={() => setTheme(isDarkMode ? "light" : "dark")}
              className="ui-button-outline px-4 py-3 min-h-[44px] flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                <span>{isDarkMode ? "DARK MODE" : "LIGHT MODE"}</span>
              </span>
              <span>[ {isDarkMode ? "LIGHT" : "DARK"} ]</span>
            </button>
            <Link
              href="/settings"
              className="ui-button-outline px-4 py-3 min-h-[44px] flex items-center gap-3"
            >
              <Settings className="w-4 h-4" />
              <span>SETTINGS</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="ui-button-outline px-4 py-3 min-h-[44px] flex items-center gap-3"
            >
              <LogOut className="w-4 h-4" />
              <span>LOG OUT</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
