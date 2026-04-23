"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { KANBAN_STAGES, VALID_TRANSITIONS } from "@/lib/constants";
import { updateProjectStatus } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData, ShotItem } from "@/types";
import type { KanbanStage } from "@/lib/constants";

function parseShotItems(json?: string): ShotItem[] {
  try {
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

interface KanbanBoardProps {
  projects: ProjectCardData[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectCardData[]>>;
  onNewProjectClick?: () => void;
  onCardClick?: (project: ProjectCardData) => void;
  onRequestPublish?: (project: ProjectCardData) => void;
}

export default function KanbanBoard({ projects, setProjects, onNewProjectClick, onCardClick, onRequestPublish }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  // Keep a snapshot to revert on failed moves
  const [snapshot, setSnapshot] = useState<ProjectCardData[]>(projects);

  // Track last invalid drop attempt so we can surface a toast on drag end
  const attemptedRef = useRef<{ target: string; error: string } | null>(null);

  // ─── Sensor: delay + tolerance so clicks are NOT intercepted ──
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Group projects by status
  const columns = KANBAN_STAGES.filter((s) => s !== "Published").reduce(
    (acc, stage) => {
      acc[stage] = projects
        .filter((p) => p.status === stage)
        .sort((a, b) => a.columnOrder - b.columnOrder);
      return acc;
    },
    {} as Record<string, ProjectCardData[]>
  );

  const activeProject = activeId
    ? projects.find((p) => p.id === activeId)
    : null;

  // ─── Validate transition (client-side) ────────────────
  function canMove(project: ProjectCardData, targetStatus: string): { ok: boolean; error?: string } {
    const from = project.status as KanbanStage;
    const to = targetStatus as KanbanStage;

    if (!VALID_TRANSITIONS[from]?.includes(to)) {
      return { ok: false, error: `Cannot move from ${from} to ${to}.` };
    }

    if (from === "Filming" && to === "Editing") {
      const aShots = parseShotItems(project.aRollShots);
      const bShots = parseShotItems(project.bRollShots);
      const aReady = aShots.length > 0 && aShots.every((s) => s.isCompleted);
      const bReady = bShots.length > 0 && bShots.every((s) => s.isCompleted);
      if (!aReady || !bReady) {
        return {
          ok: false,
          error: "All A-Roll and B-Roll shots must be completed before moving to Editing.",
        };
      }
    }

    if (from === "Editing" && to === "Review") {
      if (!project.reviewLink) {
        return { ok: false, error: "A Nextcloud Review Link is required before Review." };
      }
    }

    return { ok: true };
  }

  // ─── Card click (fires because sensor uses delay, not distance) ──
  function handleCardClick(project: ProjectCardData) {
    onCardClick?.(project);
  }

  // ─── Drag handlers ────────────────────────────────────
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id as string);
      setSnapshot([...projects]);
      attemptedRef.current = null;
    },
    [projects]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const draggedProject = projects.find((p) => p.id === active.id);
      if (!draggedProject) return;

      const overId = over.id as string;
      const isOverColumn = KANBAN_STAGES.includes(overId as KanbanStage);
      const targetStatus = isOverColumn
        ? overId
        : projects.find((p) => p.id === overId)?.status;

      if (!targetStatus || targetStatus === draggedProject.status) return;

      const check = canMove(draggedProject, targetStatus);
      if (!check.ok) {
        attemptedRef.current = { target: targetStatus, error: check.error! };
        return;
      }
      attemptedRef.current = null;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === active.id
            ? {
                ...p,
                status: targetStatus,
                // Optimistic: clear feedback when resubmitting for review
                ...(draggedProject.status === "Editing" && targetStatus === "Review" && {
                  reviewFeedback: null,
                }),
              }
            : p
        )
      );
    },
    [projects]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active } = event;
      setActiveId(null);

      const draggedProject = projects.find((p) => p.id === active.id);
      if (!draggedProject) return;

      const originalProject = snapshot.find((p) => p.id === active.id);
      if (!originalProject || originalProject.status === draggedProject.status) {
        // Surface silent rejection from handleDragOver (e.g. invalid transition)
        if (attemptedRef.current) {
          showToast(attemptedRef.current.error, "error");
          attemptedRef.current = null;
        }
        return;
      }

      // Validate against the ORIGINAL status → new status (draggedProject
      // already has the optimistic new status from handleDragOver).
      const check = canMove(originalProject, draggedProject.status);
      if (!check.ok) {
        setProjects(snapshot);
        showToast(check.error!, "error");
        return;
      }

      // ─── Intercept: Published requires the checklist modal ─────
      if (draggedProject.status === "Published") {
        if (onRequestPublish) {
          // Keep optimistic view (card already moved into Published column),
          // the parent will either confirm (server publish) or revert on cancel.
          onRequestPublish(originalProject);
          return;
        }
        // No handler wired → revert, since publish must not bypass the modal.
        setProjects(snapshot);
        return;
      }

      startTransition(async () => {
        const result = await updateProjectStatus(
          draggedProject.id,
          draggedProject.status
        );

        if (!result.success) {
          setProjects(snapshot);
          showToast(result.error, "error");
        } else {
          showToast(
            `Moved "${draggedProject.title}" to ${draggedProject.status}.`,
            "success"
          );
        }
      });
    },
    [projects, snapshot, showToast, onRequestPublish]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setProjects(snapshot);
  }, [snapshot]);

  function handleProjectUpdate(
    updated: Partial<ProjectCardData> & { id: string }
  ) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  function handleProjectRemove(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-lg h-full min-w-max pb-lg">
        {KANBAN_STAGES.filter((s) => s !== "Published").map((stage) => (
          <KanbanColumn
            key={stage}
            id={stage}
            title={stage.toUpperCase()}
            count={columns[stage]?.length ?? 0}
            isFilming={stage === "Filming"}
            onAddClick={onNewProjectClick}
          >
            {(columns[stage] ?? []).map((project) => (
              <KanbanCard
                key={project.id}
                project={project}
                onProjectUpdate={handleProjectUpdate}
                onRemove={handleProjectRemove}
                onClick={handleCardClick}
                onRequestPublish={onRequestPublish}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="opacity-80">
            <KanbanCard
              project={activeProject}
              isDragOverlay
              onProjectUpdate={handleProjectUpdate}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

