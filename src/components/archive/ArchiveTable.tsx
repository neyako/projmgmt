"use client";

import { useState, useTransition, useEffect } from "react";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import UpdateStatsModal from "@/components/modals/UpdateStatsModal";
import { restoreProjectToPipeline } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";
import { useT } from "@/lib/i18n/client";

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
  const t = useT();
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
      showToast(t("archive.restored"), "success");
    });
  }

  return (
    <>
      <div className="h-full w-full overflow-auto p-lg">
        <div className="mb-6">
          <h1 className="ui-page-kicker mb-1">
            {t("archive.title")}
          </h1>
          <div className="flex gap-3 md:gap-6 border-b border-border-visible pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("Published")}
              className={`text-xl md:text-2xl font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeTab === "Published" ? "text-text-display" : "text-text-disabled hover:text-text-secondary"
              }`}
            >
              {t("archive.published")}
            </button>
            <button
              onClick={() => setActiveTab("Scrapped")}
              className={`text-xl md:text-2xl font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeTab === "Scrapped" ? "text-text-display" : "text-text-disabled hover:text-text-secondary"
              }`}
            >
              {t("archive.scrapped")}
            </button>
          </div>
          <div className="ui-page-meta mt-2">
            {activeData.length} {activeData.length === 1 ? t("archive.project") : t("archive.projects")}
          </div>
        </div>

        {activeData.length === 0 ? (
          <div className="ui-panel p-12 text-center">
            <div className="ui-page-kicker">
              {t("archive.noFoundFor", { tab: t(`archive.tab${activeTab}`) })}
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-3">
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
                  <div
                    key={project.id}
                    onClick={() => setSelectedId(project.id)}
                    className="ui-panel p-4 flex flex-col gap-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold font-mono text-text-display uppercase tracking-wider break-words">
                          {project.title}
                        </div>
                        <div className="ui-page-meta mt-2">
                          {formatDate(activeTab === "Published" ? project.publishDate : project.updatedAt)}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-2 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "Published" ? "bg-success" : "bg-text-disabled"}`} />
                        <span className="uppercase tracking-widest text-[10px] text-text-secondary">
                          {t(`stageDisplay.${project.status}`)}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-border-visible pt-3">
                      <div>
                        <div className="ui-page-kicker">{t("archive.views")}</div>
                        <div className="text-sm font-mono text-text-display">
                          {totalViews.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="ui-page-kicker">{t("archive.likes")}</div>
                        <div className="text-sm font-mono text-text-display">
                          {totalLikes.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="ui-page-kicker">{t("archive.comments")}</div>
                        <div className="text-sm font-mono text-text-display">
                          {totalComments.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {activeTab === "Published" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatsTargetId(project.id);
                          }}
                          disabled={isPending}
                          className="ui-button-outline px-3 py-2 disabled:opacity-50"
                        >
                          {t("archive.updateStats")}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(project.id);
                        }}
                        disabled={isPending}
                        className="ui-button-outline px-3 py-2 disabled:opacity-50"
                      >
                        {t("archive.restore")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="ui-table-head p-4">
                    {t("archive.videoTitle")}
                  </th>
                  <th className="ui-table-head p-4">
                    {t("archive.status")}
                  </th>
                  <th className="ui-table-head p-4">
                    {activeTab === "Published" ? t("archive.publishDate") : t("archive.lastUpdated")}
                  </th>
                  <th className="ui-table-head p-4 text-right">
                    {t("archive.views")}
                  </th>
                  <th className="ui-table-head p-4 text-right">
                    {t("archive.likes")}
                  </th>
                  <th className="ui-table-head p-4 text-right">
                    {t("archive.comments")}
                  </th>
                  <th className="ui-table-head p-4 text-right">
                    {t("archive.action")}
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
                            {t(`stageDisplay.${project.status}`)}
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
                              {t("archive.updateStats")}
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
                            {t("archive.restoreShort")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
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
