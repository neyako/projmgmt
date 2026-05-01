"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import Tag from "@/components/ui/Tag";
import type { ProjectCardData } from "@/types";
import { parsePlatforms } from "@/lib/utils";
import FilmingSplitCard from "./FilmingSplitCard";
import ReviewPanel from "./ReviewPanel";
import CardMenu from "./CardMenu";
import { useLocale, useT } from "@/lib/i18n/client";
import { toIntlLocale, type Locale } from "@/lib/i18n/locales";

interface KanbanCardProps {
  project: ProjectCardData;
  isDragOverlay?: boolean;
  onProjectUpdate?: (updated: Partial<ProjectCardData> & { id: string }) => void;
  onRemove?: (id: string) => void;
  onClick?: (project: ProjectCardData) => void;
  onRequestPublish?: (project: ProjectCardData) => void;
  bootDelayMs?: number;
}

function formatScopeDeadline(date: Date | string | null | undefined, locale: Locale) {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed
    .toLocaleDateString(toIntlLocale(locale), { month: "short", day: "2-digit" })
    .toUpperCase();
}

function getScopeDeadline(project: ProjectCardData) {
  switch (project.status) {
    case "Scripting":
      return { labelKey: "kanban.scriptingDue", date: project.scriptingDueDate };
    case "Editing":
      return { labelKey: "kanban.editingDue", date: project.editingDueDate };
    default:
      return null;
  }
}

export default function KanbanCard({
  project,
  isDragOverlay = false,
  onProjectUpdate,
  onRemove,
  onClick,
  onRequestPublish,
  bootDelayMs,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });
  const t = useT();
  const locale = useLocale();

  const steppedTransition = transition?.replace(/ease(?:-[a-z]+)*/g, "steps(2, end)");
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: steppedTransition,
  };
  const bootStyle = !isDragOverlay && bootDelayMs !== undefined
    ? { animationDelay: `${bootDelayMs}ms` }
    : undefined;

  const platforms = parsePlatforms(project.platformsTargeted);
  const scopeDeadline = getScopeDeadline(project);
  const assignmentValues: Array<
    string | { id: string; name?: string | null; avatarUrl?: string | null } | null | undefined
  > = [
    project.assignedEditor,
    project.assignedCameraman,
    project.assignedTalent,
    project.aRollAssignee,
    project.bRollAssignee,
    project.editingAssignee,
  ];
  const assignees = assignmentValues.reduce<
    Array<{ id: string; name: string; avatarUrl?: string | null }>
  >((list, value, index) => {
    if (!value) {
      return list;
    }

    const name = typeof value === "string" ? value.trim() : value.name?.trim();

    if (!name || name.toUpperCase() === "UNASSIGNED") {
      return list;
    }

    const id = typeof value === "string" ? name.toUpperCase() : value.id;

    if (list.some((assignee) => assignee.id === id)) {
      return list;
    }

    list.push({
      id,
      name,
      avatarUrl: typeof value === "string" ? null : value.avatarUrl,
    });

    return list;
  }, []);

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

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
        <div className={cn(!isDragOverlay && "animate-terminal-boot")} style={bootStyle}>
          <FilmingSplitCard
            project={project}
            onProjectUpdate={onProjectUpdate}
            onRemove={onRemove}
          />
        </div>
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
      className={cn(isDragging && "opacity-30")}
    >
      <div
        className={cn(
          "bg-surface border p-md flex flex-col gap-sm hover:border-text-display cursor-pointer group",
          !isDragOverlay && "animate-terminal-boot",
          project.status === "Editing" && project.reviewFeedback
            ? "border-accent/30"
            : "border-border"
        )}
        style={bootStyle}
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

      {scopeDeadline?.date && (
        <div className="flex items-center justify-between gap-3 mt-xs border border-border-visible bg-input-surface px-2 py-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">
            {t(scopeDeadline.labelKey)}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest whitespace-nowrap text-text-display">
            {formatScopeDeadline(scopeDeadline.date, locale)}
          </span>
        </div>
      )}

      {/* Rejection feedback alert */}
      {project.status === "Editing" && project.reviewFeedback && (
        <div className="mt-3 p-2 bg-accent-subtle border-l-2 border-accent rounded-sm">
          <span className="text-[9px] font-mono text-accent uppercase tracking-widest mb-1 block">
            {t("kanban.revisionNotes")}
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
        {assignees.length > 0 ? (
          <div className="flex items-center">
            {assignees.map((assignee, index) => (
              <div
                key={assignee.id}
                className={cn(
                  "w-7 h-7 border border-border-visible bg-surface-raised text-text-primary text-xs font-mono flex items-center justify-center overflow-hidden",
                  index > 0 ? "-ml-2" : "ml-0"
                )}
                style={{ zIndex: assignees.length - index }}
                title={assignee.name}
              >
                {assignee.avatarUrl ? (
                  <Image
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    width={28}
                    height={28}
                    className="w-7 h-7 object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{getInitials(assignee.name)}</span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
