"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import StatusDot from "@/components/ui/StatusDot";

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  isFilming?: boolean;
  onAddClick?: () => void;
  children: React.ReactNode;
}

export default function KanbanColumn({
  id,
  title,
  count,
  isFilming = false,
  onAddClick,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Collect child IDs for SortableContext
  const childIds: string[] = [];
  if (Array.isArray(children)) {
    children.forEach((child: any) => {
      if (child?.props?.project?.id) {
        childIds.push(child.props.project.id);
      }
    });
  }

  return (
    <div className="w-[320px] flex flex-col flex-shrink-0 h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-md border-b border-border-visible pb-2 h-7">
        <div className="flex items-center gap-2">
          <span className="text-style-label text-text-primary">{title}</span>
          <span className="text-style-label text-text-secondary">
            [ {count} ]
          </span>
          {isFilming && <StatusDot color="accent" pulse />}
        </div>
        <button
          onClick={onAddClick}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label={`Add project to ${title}`}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>

      {/* Drop Zone */}
      <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-col gap-md overflow-y-auto pr-2 flex-1 pb-xl transition-colors",
            isOver && "bg-surface-raised/20"
          )}
        >
          {count === 0 ? (
            <div
              className="border border-dashed border-border-visible h-32 flex flex-col items-center justify-center text-text-disabled gap-2 cursor-pointer hover:border-text-secondary hover:text-text-secondary transition-colors"
              onClick={onAddClick}
            >
              <span className="material-symbols-outlined text-[24px]">
                add_circle
              </span>
              <span className="text-style-caption">ADD PROJECT</span>
            </div>
          ) : (
            children
          )}
        </div>
      </SortableContext>
    </div>
  );
}
