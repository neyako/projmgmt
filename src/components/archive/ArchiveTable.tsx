"use client";

import { useState, useTransition, useEffect } from "react";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import { restoreProjectToPipeline } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";
import type { Analytics } from "@prisma/client";

type ArchiveProject = ProjectCardData & {
  publishDate?: Date | string | null;
  updatedAt?: Date | string | null;
  analytics?: Analytics[];
};

interface ArchiveTableProps {
  published: ArchiveProject[];
  scrapped: ArchiveProject[];
}

function sumAnalytics(items: Analytics[] | undefined, key: "views" | "likes" | "comments") {
  if (!items || items.length === 0) return 0;
  return items.reduce((acc, a) => acc + (a[key] ?? 0), 0);
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
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

  useEffect(() => {
    setPublishedData(published);
    setScrappedData(scrapped);
    setSelectedId(null);
  }, [published, scrapped]);

  const activeData = activeTab === "Published" ? publishedData : scrappedData;

  const selectedProject = selectedId
    ? activeData.find((p) => p.id === selectedId) ?? null
    : null;

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
          <h1 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
            Archive
          </h1>
          <div className="flex gap-6 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("Published")}
              className={`text-2xl font-bold uppercase tracking-wider transition-colors ${
                activeTab === "Published" ? "text-white" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              [ PUBLISHED ]
            </button>
            <button
              onClick={() => setActiveTab("Scrapped")}
              className={`text-2xl font-bold uppercase tracking-wider transition-colors ${
                activeTab === "Scrapped" ? "text-white" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              [ SCRAPPED ]
            </button>
          </div>
          <div className="text-xs font-mono text-gray-500 mt-2">
            {activeData.length} {activeData.length === 1 ? "project" : "projects"}
          </div>
        </div>

        {activeData.length === 0 ? (
          <div className="border border-white/10 p-12 text-center">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              No {activeTab} Projects Found
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  Video Title
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  Status
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  {activeTab === "Published" ? "Publish Date" : "Last Updated"}
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                  Views
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                  Likes
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                  Comments
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {activeData.map((p) => {
                const views = sumAnalytics(p.analytics, "views");
                const likes = sumAnalytics(p.analytics, "likes");
                const comments = sumAnalytics(p.analytics, "comments");
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-sm font-mono text-gray-300">{p.title}</td>
                    <td className="p-4 text-sm font-mono text-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "Published" ? "bg-emerald-500" : "bg-gray-500"}`} />
                        <span className="uppercase tracking-widest text-[10px]">
                          {p.status}
                        </span>
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-300">
                      {formatDate(activeTab === "Published" ? p.publishDate : p.updatedAt)}
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-300 text-right">
                      {formatNumber(views)}
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-300 text-right">
                      {formatNumber(likes)}
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-300 text-right">
                      {formatNumber(comments)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(p.id);
                        }}
                        disabled={isPending}
                        className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        Restore to Pipeline
                      </button>
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
    </>
  );
}
