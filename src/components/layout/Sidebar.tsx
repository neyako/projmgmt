"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NAV_FOOTER_ITEMS } from "@/lib/constants";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col gap-2 p-4 h-full fixed left-0 top-0 w-64 border-r border-border bg-black z-50">
      {/* Logo */}
      <div className="mb-xl flex items-center gap-sm">
        <div className="w-8 h-8 bg-surface-raised border border-border flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-text-secondary">
            camera
          </span>
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-label)] text-xl font-black text-text-display">
            STUDIO
          </h1>
          <div className="text-style-label text-text-secondary mt-[2px]">
            V2.0.4-SYS
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 flex flex-col gap-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 flex items-center gap-4 text-style-label tracking-widest transition-all duration-150 active:scale-95",
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

      {/* Footer Nav */}
      <div className="mt-auto pt-md border-t border-border">
        {NAV_FOOTER_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 flex items-center gap-4 text-style-label tracking-widest transition-all duration-150 active:scale-95",
                isActive
                  ? "text-text-display border border-border-visible bg-surface-raised"
                  : "text-text-disabled hover:text-text-display hover:bg-surface-raised border border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
