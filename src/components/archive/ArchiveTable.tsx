"use client";

import { useState } from "react";
import ProjectDetailsModal from "@/components/modals/ProjectDetailsModal";
import type { ProjectCardData } from "@/types";
import type { Analytics } from "@prisma/client";

type ArchiveProject = ProjectCardData & {
  publishDate?: Date | string | null;
  analytics?: Analytics[];
};

interface ArchiveTableProps {
  initialProjects: ArchiveProject[];
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

export default function ArchiveTable({ initialProjects }: ArchiveTableProps) {
  const [projects, setProjects] = useState<ArchiveProject[]>(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProject = selectedId
    ? projects.find((p) => p.id === selectedId) ?? null
    : null;

  function handleProjectUpdate(updated: Partial<ProjectCardData> & { id: string }) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  return (
    <>
      <div className="h-full w-full overflow-auto p-lg">
        <div className="mb-6">
          <h1 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
            Archive
          </h1>
          <div className="text-2xl font-bold text-white uppercase tracking-wider">
            Published Videos
          </div>
          <div className="text-xs font-mono text-gray-500 mt-1">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="border border-white/10 p-12 text-center">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              No Published Projects Found
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
                  Publish Date
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
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
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
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="uppercase tracking-widest text-[10px]">
                          {p.status}
                        </span>
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-300">
                      {formatDate(p.publishDate)}
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
