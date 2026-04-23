"use client";

import { useState, useEffect } from "react";
import KanbanBoard from "./KanbanBoard";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import type { ProjectCardData } from "@/types";

interface KanbanBoardWrapperProps {
  initialProjects: ProjectCardData[];
}

export default function KanbanBoardWrapper({
  initialProjects,
}: KanbanBoardWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectCardData[]>(initialProjects);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  // Prevent SSR render of DndContext (hydration mismatch fix)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-max min-w-full p-lg">
        <div className="flex gap-lg h-full min-w-max pb-lg">
          {["IDEATION", "SCRIPTING", "FILMING", "EDITING", "REVIEW"].map((stage) => (
            <div key={stage} className="w-[320px] flex flex-col flex-shrink-0 h-full">
              <div className="flex items-center gap-2 mb-md border-b border-border-visible pb-2">
                <span className="text-style-label text-text-primary">{stage}</span>
                <span className="text-style-label text-text-secondary">[ — ]</span>
              </div>
              <div className="flex-1 animate-pulse bg-surface-raised/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function handleNewProjectClick() {
    setSelectedProjectId(null);
    setIsModalOpen(true);
  }

  function handleCardClick(project: ProjectCardData) {
    setSelectedProjectId(project.id);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedProjectId(null);
  }

  function handleProjectCreated() {
    setIsModalOpen(false);
    setSelectedProjectId(null);
    window.location.reload();
  }

  function handleProjectUpdate(updated: Partial<ProjectCardData> & { id: string }) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  return (
    <>
      {/* Scrollable board area */}
      <div className="h-full w-max min-w-full p-lg">
        <KanbanBoard
          projects={projects}
          setProjects={setProjects}
          onNewProjectClick={handleNewProjectClick}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Centered widescreen modal — rendered as sibling outside overflow container */}
      {isModalOpen && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={handleCloseModal}
          onCreated={handleProjectCreated}
          onProjectUpdate={handleProjectUpdate}
        />
      )}
    </>
  );
}
