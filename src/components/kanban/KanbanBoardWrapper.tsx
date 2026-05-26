"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import KanbanBoard from "./KanbanBoard";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import PublishModal from "@/components/modals/PublishModal";
import { MotionBlock } from "@/components/motion/TerminalMotion";
import type { ProjectCardData } from "@/types";
import { useT } from "@/lib/i18n/client";

interface KanbanBoardWrapperProps {
  initialProjects: ProjectCardData[];
  frequentHashtags: string[];
}

export default function KanbanBoardWrapper({
  initialProjects,
  frequentHashtags,
}: KanbanBoardWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectCardData[]>(initialProjects);
  const [publishingProject, setPublishingProject] = useState<ProjectCardData | null>(null);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  // Prevent SSR render of DndContext (hydration mismatch fix)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync with server-filtered project list (search query updates)
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setSelectedProjectId(null);
      setIsModalOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      window.history.replaceState(
        null,
        "",
        params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname
      );
    }
  }, [searchParams]);

  if (!isMounted) {
    return (
      <div className="h-full w-full min-w-0 p-md md:p-lg overflow-x-auto overflow-y-hidden">
        <div className="flex gap-md md:gap-lg h-full md:min-w-max pb-lg snap-x snap-mandatory md:snap-none">
          {(["Ideation", "Scripting", "Filming", "Editing", "Review"] as const).map((stage) => (
            <div key={stage} className="w-[85vw] max-w-[320px] md:w-[280px] lg:w-[320px] flex flex-col flex-shrink-0 h-full snap-center">
              <div className="flex items-center gap-2 mb-md border-b border-border-visible pb-2">
                <span className="text-style-label text-text-primary">{t(`stage.${stage}`)}</span>
                <span className="text-style-label text-text-secondary">[ — ]</span>
              </div>
              <MotionBlock preset="crt" className="flex-1 bg-surface-raised/10" />
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

  function handleRequestPublish(project: ProjectCardData) {
    // Pin the pre-publish snapshot so the modal keeps its context even when
    // the card gets optimistically removed from the board.
    setPublishingProject(project);
  }

  function handlePublishClose() {
    if (!publishingProject) return;
    // User cancelled — revert any optimistic Published status on the board.
    setProjects((prev) =>
      prev.map((p) =>
        p.id === publishingProject.id ? { ...p, status: publishingProject.status } : p
      )
    );
    setPublishingProject(null);
  }

  function handlePublished(updated: Partial<ProjectCardData> & { id: string }) {
    // Published cards leave the pipeline view entirely.
    setProjects((prev) => prev.filter((p) => p.id !== updated.id));
    setPublishingProject(null);
    // Let the Analytics / Archive views pick up the new row.
    router.refresh();
  }

  return (
    <>
      {/* Scrollable board area */}
      <div className="h-full w-full min-w-0 p-md md:p-lg overflow-x-auto overflow-y-hidden">
        <KanbanBoard
          projects={projects}
          setProjects={setProjects}
          onNewProjectClick={handleNewProjectClick}
          onCardClick={handleCardClick}
          onRequestPublish={handleRequestPublish}
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

      {publishingProject && (
        <PublishModal
          project={publishingProject}
          frequentHashtags={frequentHashtags}
          onClose={handlePublishClose}
          onPublished={handlePublished}
        />
      )}
    </>
  );
}
