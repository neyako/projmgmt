"use client";

import { cn } from "@/lib/utils";
import type { ShotItem } from "@/types";
import { useT } from "@/lib/i18n/client";

interface ShotRowProps {
  shot: ShotItem;
  onToggle: (shotId: string) => void;
  onDelete?: (shotId: string) => void;
}

export default function ShotRow({ shot, onToggle, onDelete }: ShotRowProps) {
  const t = useT();
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-text-display hover:text-text-inverse group"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={shot.isCompleted}
        onClick={() => onToggle(shot.id)}
        className={cn(
          "w-3.5 h-3.5 flex items-center justify-center border shrink-0 bg-transparent",
          shot.isCompleted
            ? "border-success text-success"
            : "border-border-visible group-hover:border-text-display"
        )}
      >
        {shot.isCompleted && (
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span
        className={cn(
          "flex-1 text-xs font-mono",
          shot.isCompleted ? "line-through text-text-disabled group-hover:text-text-inverse" : "text-text-primary group-hover:text-text-inverse"
        )}
      >
        {shot.text}
      </span>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(shot.id)}
          className="text-text-disabled hover:bg-accent hover:text-text-inverse opacity-0 group-hover:opacity-100 text-[10px] font-mono shrink-0"
          aria-label={t("kanban.deleteShot")}
        >
          ✕
        </button>
      )}
    </div>
  );
}
