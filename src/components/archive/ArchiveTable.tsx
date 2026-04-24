"use client";

import { useState, useTransition, useEffect } from "react";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import UpdateStatsModal from "@/components/modals/UpdateStatsModal";
import { restoreProjectToPipeline } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";

type ArchiveProject = ProjectCardData & {
  publishDate?: Date | string | null;
  updatedAt?: Date | string | null;
  youtubeViews?: number;
  metaViews?: number;
  tiktokViews?: number;
  youtubeLikes?: number;
  metaLikes?: number;
  tiktokLikes?: number;
  youtubeComments?: number;
  metaComments?: number;
  tiktokComments?: number;
};
interface ArchiveTableProps {
  published: ArchiveProject[];
  scrapped: ArchiveProject[];
}

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
    .toUpperCase();
}

export default function ArchiveTable({ published, scrapped }: ArchiveTableProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"Published" | "Scrapped">("Published");
  const [publishedData, setPublishedData] = useState<ArchiveProject[]>(published);
  const [scrappedData, setScrappedData] = useState<ArchiveProject[]>(scrapped);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statsTargetId, setStatsTargetId] = useState<string | null>(null);

  useEffect(() => {
    setPublishedData(published);
    setScrappedData(scrapped);
    setSelectedId(null);
  }, [published, scrapped]);

  const activeData = activeTab === "Published" ? publishedData : scrappedData;

  const selectedProject = selectedId
    ? activeData.find((p) => p.id === selectedId) ?? null
    : null;

  const statsTargetProject = statsTargetId
    ? publishedData.find((p) => p.id === statsTargetId) ?? null
    : null;

  function handleStatsUpdated(
    projectId: string,
    stats: { views: number; likes: number; comments: number }
  ) {
    setPublishedData((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...stats } : p))
    );
  }

  function handleProjectUpdate(updated: Partial<ProjectCardData> & { id: string }) {
    if (activeTab === "Published") {
      setPublishedData((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } else {
      setScrappedData((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    }
  }

  function handleRestore(projectId: string) {
    startTransition(async () => {
      const result = await restoreProjectToPipeline(projectId);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      setPublishedData((prev) => prev.filter((p) => p.id !== projectId));
      setScrappedData((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedId === projectId) setSelectedId(null);
      showToast("Project restored to Ideation.", "success");
    });
  }

  return (
    <>
      <div className="h-full w-full overflow-auto p-lg">
        <div className="mb-6">
          <h1 className="ui-page-kicker mb-1">
            Archive
          </h1>
          <div className="flex gap-6 border-b border-border-visible pb-2">
            <button
              onClick={() => setActiveTab("Published")}
              className={`text-2xl font-bold uppercase tracking-wider transition-colors ${
                activeTab === "Published" ? "text-text-display" : "text-text-disabled hover:text-text-secondary"
              }`}
            >
              [ PUBLISHED ]
            </button>
            <button
              onClick={() => setActiveTab("Scrapped")}
              className={`text-2xl font-bold uppercase tracking-wider transition-colors ${
                activeTab === "Scrapped" ? "text-text-display" : "text-text-disabled hover:text-text-secondary"
              }`}
            >
              [ SCRAPPED ]
            </button>
          </div>
          <div className="ui-page-meta mt-2">
            {activeData.length} {activeData.length === 1 ? "project" : "projects"}
          </div>
        </div>

        {activeData.length === 0 ? (
          <div className="ui-panel p-12 text-center">
            <div className="ui-page-kicker">
              No {activeTab} Projects Found
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="ui-table-head p-4">
                  Video Title
                </th>
                <th className="ui-table-head p-4">
                  Status
                </th>
                <th className="ui-table-head p-4">
                  {activeTab === "Published" ? "Publish Date" : "Last Updated"}
                </th>
                <th className="ui-table-head p-4 text-right">
                  Views
                </th>
                <th className="ui-table-head p-4 text-right">
                  Likes
                </th>
                <th className="ui-table-head p-4 text-right">
                  Comments
                </th>
                <th className="ui-table-head p-4 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {activeData.map((project) => {
                const totalViews =
                  (project.youtubeViews || 0) +
                  (project.metaViews || 0) +
                  (project.tiktokViews || 0);
                const totalLikes =
                  (project.youtubeLikes || 0) +
                  (project.metaLikes || 0) +
                  (project.tiktokLikes || 0);
                const totalComments =
                  (project.youtubeComments || 0) +
                  (project.metaComments || 0) +
                  (project.tiktokComments || 0);

                return (
                  <tr
                    key={project.id}
                    onClick={() => setSelectedId(project.id)}
                    className="ui-table-row cursor-pointer"
                  >
                    <td className="p-4 ui-table-cell">{project.title}</td>
                    <td className="p-4 ui-table-cell">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "Published" ? "bg-success" : "bg-text-disabled"}`} />
                        <span className="uppercase tracking-widest text-[10px]">
                          {project.status}
                        </span>
                      </span>
                    </td>
                    <td className="p-4 ui-table-cell">
                      {formatDate(activeTab === "Published" ? project.publishDate : project.updatedAt)}
                    </td>
                    <td className="p-4 ui-table-cell text-right">
                      {totalViews.toLocaleString()}
                    </td>
                    <td className="p-4 ui-table-cell text-right">
                      {totalLikes.toLocaleString()}
                    </td>
                    <td className="p-4 ui-table-cell text-right">
                      {totalComments.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {activeTab === "Published" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatsTargetId(project.id);
                            }}
                            disabled={isPending}
                            className="ui-button-outline px-3 py-1 disabled:opacity-50"
                          >
                            [ UPDATE STATS ]
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(project.id);
                          }}
                          disabled={isPending}
                          className="ui-button-outline px-3 py-1 disabled:opacity-50"
                        >
                          Restore to Pipeline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedId(null)}
          onCreated={() => setSelectedId(null)}
          onProjectUpdate={handleProjectUpdate}
        />
      )}

      {statsTargetProject && (
        <UpdateStatsModal
          project={{
            id: statsTargetProject.id,
            title: statsTargetProject.title,
            finalTitle: statsTargetProject.finalTitle ?? null,
            views: statsTargetProject.views ?? 0,
            likes: statsTargetProject.likes ?? 0,
            comments: statsTargetProject.comments ?? 0,
          }}
          onClose={() => setStatsTargetId(null)}
          onUpdated={(stats) =>
            handleStatsUpdated(statsTargetProject.id, stats)
          }
        />
      )}
    </>
  );
}
