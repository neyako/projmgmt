import Shell from "@/components/layout/Shell";
import { prisma } from "@/lib/prisma";

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

export default async function AnalyticsPage() {
  const published = await prisma.project.findMany({
    where: { status: "Published" },
    orderBy: { views: "desc" },
  });

  const totalViews = published.reduce((sum, p) => sum + (p.views ?? 0), 0);
  const totalLikes = published.reduce((sum, p) => sum + (p.likes ?? 0), 0);
  const totalComments = published.reduce((sum, p) => sum + (p.comments ?? 0), 0);

  const metrics = [
    { label: "TOTAL VIEWS", value: totalViews },
    { label: "TOTAL LIKES", value: totalLikes },
    { label: "TOTAL COMMENTS", value: totalComments },
  ];

  return (
    <Shell>
      <div className="h-full w-full overflow-auto p-lg">
        <div className="mb-6">
          <h1 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
            Performance
          </h1>
          <div className="text-2xl font-bold text-white uppercase tracking-wider">
            Analytics Dashboard
          </div>
          <div className="text-xs font-mono text-gray-500 mt-1">
            {published.length} {published.length === 1 ? "video" : "videos"} published
          </div>
        </div>

        {/* ─── Aggregate Metrics ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="border border-white/10 bg-[#0a0a0a] p-6 flex flex-col"
            >
              <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">
                {m.label}
              </span>
              <span className="text-4xl font-mono text-white tracking-widest mt-2">
                {formatNumber(m.value)}
              </span>
            </div>
          ))}
        </div>

        {/* ─── Top Performers ──────────────────────────────── */}
        <div>
          <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">
            Top Performers
          </h2>

          {published.length === 0 ? (
            <div className="border border-white/10 p-12 text-center">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                No Published Videos Yet
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                    Title
                  </th>
                  <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                    Views
                  </th>
                  <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                    Likes
                  </th>
                  <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                    Publish Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {published.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-sm font-mono text-gray-300 font-bold">
                      {p.finalTitle ?? p.title}
                    </td>
                    <td className="p-4 text-sm font-mono text-success text-right">
                      {formatNumber(p.views ?? 0)}
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-300 text-right">
                      {formatNumber(p.likes ?? 0)}
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-400">
                      {formatDate(p.publishedAt ?? p.publishDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  );
}
