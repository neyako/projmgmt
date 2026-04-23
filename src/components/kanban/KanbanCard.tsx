"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import Tag from "@/components/ui/Tag";
import type { ProjectCardData } from "@/types";
import { parsePlatforms } from "@/lib/utils";
import FilmingSplitCard from "./FilmingSplitCard";
import ReviewPanel from "./ReviewPanel";
import CardMenu from "./CardMenu";

interface KanbanCardProps {
  project: ProjectCardData;
  isDragOverlay?: boolean;
  onProjectUpdate?: (updated: Partial<ProjectCardData> & { id: string }) => void;
  onRemove?: (id: string) => void;
  onClick?: (project: ProjectCardData) => void;
  onRequestPublish?: (project: ProjectCardData) => void;
}

export default function KanbanCard({
  project,
  isDragOverlay = false,
  onProjectUpdate,
  onRemove,
  onClick,
  onRequestPublish,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const platforms = parsePlatforms(project.platformsTargeted);

  // ─── Click handler (fires on quick click, drag sensor uses delay) ──
  function handleClick() {
    // Don't fire click if we were dragging
    if (isDragging) return;
    onClick?.(project);
  }

  // Filming cards get special split-state rendering
  if (project.status === "Filming") {
    return (
      <div
        ref={!isDragOverlay ? setNodeRef : undefined}
        style={!isDragOverlay ? style : undefined}
        {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
        onClick={!isDragOverlay ? handleClick : undefined}
        className={cn(isDragging && "opacity-30")}
      >
        <FilmingSplitCard
          project={project}
          onProjectUpdate={onProjectUpdate}
          onRemove={onRemove}
        />
      </div>
    );
  }

  // Standard card for all other columns
  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={!isDragOverlay ? style : undefined}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
      onClick={!isDragOverlay ? handleClick : undefined}
      className={cn(
        "bg-surface border p-md flex flex-col gap-sm hover:border-border-visible transition-colors cursor-pointer group",
        project.status === "Editing" && project.reviewFeedback
          ? "border-accent/30 shadow-[0_0_10px_rgba(215,25,33,0.1)]"
          : "border-border",
        isDragging && "opacity-30"
      )}
    >
      {/* Title + Menu */}
      <div className="flex justify-between items-start">
        <div className="text-style-subheading text-text-primary font-[family-name:var(--font-heading)]">
          {project.title}
        </div>
        <CardMenu projectId={project.id} onRemove={() => onRemove?.(project.id)} />
      </div>

      {/* Tags */}
      {platforms.length > 0 && (
        <div className="flex gap-2 mt-xs">
          {platforms.map((p) => (
            <Tag key={p} label={p} />
          ))}
        </div>
      )}

      {/* Rejection feedback alert */}
      {project.status === "Editing" && project.reviewFeedback && (
        <div className="mt-3 p-2 bg-accent-subtle border-l-2 border-accent rounded-sm">
          <span className="text-[9px] font-mono text-accent uppercase tracking-widest mb-1 block">
            REVISION NOTES
          </span>
          <p className="text-xs font-mono text-accent/80 line-clamp-3">
            {project.reviewFeedback}
          </p>
        </div>
      )}

      {/* Review: Interactive approve/reject UI */}
      {project.status === "Review" && (
        <ReviewPanel
          project={project}
          onProjectUpdate={onProjectUpdate}
          onRequestPublish={onRequestPublish}
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-sm pt-sm border-t border-border">
        <div className="text-style-caption text-text-secondary">
          #{project.id.slice(-6).toUpperCase()}
        </div>
        {project.creator && (
          <div className="w-6 h-6 rounded-full bg-surface-variant overflow-hidden border border-border-visible flex items-center justify-center">
            <span className="text-style-label text-[9px] text-text-primary">
              {project.creator.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
