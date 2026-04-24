"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const visibleNavItems = getVisibleNavItems(session?.user?.role);

  return (
    <nav className="hidden md:flex flex-col gap-2 p-4 h-full fixed left-0 top-0 w-64 border-r border-border bg-background z-50">
      <div className="mb-xl px-3">
        <h1 className="font-[family-name:var(--font-label)] text-[44px] font-black text-text-display tracking-tight">
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
    </nav>
  );
}
