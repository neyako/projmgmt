"use client";

import { cn } from "@/lib/utils";
import type { ShotItem } from "@/types";

interface ShotRowProps {
  shot: ShotItem;
  onToggle: (shotId: string) => void;
  onDelete?: (shotId: string) => void;
}

export default function ShotRow({ shot, onToggle, onDelete }: ShotRowProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-white/5 transition-colors group"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={shot.isCompleted}
        onClick={() => onToggle(shot.id)}
        className={cn(
          "w-3.5 h-3.5 flex items-center justify-center border shrink-0 bg-transparent transition-colors",
          shot.isCompleted
            ? "border-success text-success"
            : "border-gray-600 group-hover:border-gray-400"
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
          "flex-1 text-xs font-mono transition-colors",
          shot.isCompleted ? "line-through text-gray-600" : "text-gray-300"
        )}
      >
        {shot.text}
      </span>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(shot.id)}
          className="text-gray-700 hover:text-accent transition-colors opacity-0 group-hover:opacity-100 text-[10px] font-mono shrink-0"
          aria-label="Delete shot"
        >
          ✕
        </button>
      )}
    </div>
  );
}
