"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleShotlistItem } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ShotlistItem } from "@prisma/client";

interface ShotlistChecklistProps {
  projectId: string;
  items: ShotlistItem[];
  onUpdate?: (updatedItems: ShotlistItem[], allComplete: boolean) => void;
}

export default function ShotlistChecklist({
  projectId,
  items: initialItems,
  onUpdate,
}: ShotlistChecklistProps) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleToggle(itemId: string, completed: boolean) {
    // Optimistic update
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, completed } : item
    );
    setItems(updated);

    const allComplete = updated.length > 0 && updated.every((i) => i.completed);
    onUpdate?.(updated, allComplete);

    startTransition(async () => {
      const result = await toggleShotlistItem(projectId, itemId, completed);
      if (!result.success) {
        // Revert on error
        const reverted = items.map((item) =>
          item.id === itemId ? { ...item, completed: !completed } : item
        );
        setItems(reverted);
        const revertAllComplete =
          reverted.length > 0 && reverted.every((i) => i.completed);
        onUpdate?.(reverted, revertAllComplete);
        showToast(result.error, "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1 pl-6">
      {items
        .sort((a, b) => a.order - b.order)
        .map((item) => (
          <label
            key={item.id}
            onClick={(e) => e.stopPropagation()}
            className="flex items-start gap-2 cursor-pointer group"
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={item.completed}
              onClick={() => handleToggle(item.id, !item.completed)}
              className={cn(
                "w-3 h-3 flex items-center justify-center border bg-transparent rounded-none shrink-0 transition-colors mt-[3px]",
                item.completed
                  ? "bg-white border-white"
                  : "border-border-visible group-hover:border-outline-variant"
              )}
            >
              {item.completed && (
                <svg
                  className="w-2 h-2 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={4}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span
              className={cn(
                "text-xs font-mono transition-colors",
                item.completed ? "line-through text-text-disabled" : "text-text-secondary"
              )}
            >
              {item.label}
            </span>
          </label>
        ))}
    </div>
  );
}
