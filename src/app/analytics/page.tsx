import Shell from "@/components/layout/Shell";
import SyncButton from "@/components/analytics/SyncButton";
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
  const publishedRaw = await prisma.project.findMany({
    where: { status: "Published" },
  });

  // Compute grand totals per project from platform-specific columns,
  // ignoring the legacy generic `views`/`likes`/`comments` columns.
  const published = publishedRaw
    .map((p) => {
      const totalViews =
        (p.youtubeViews ?? 0) + (p.metaViews ?? 0) + (p.tiktokViews ?? 0);
      const totalLikes =
        (p.youtubeLikes ?? 0) + (p.metaLikes ?? 0) + (p.tiktokLikes ?? 0);
      const totalComments =
        (p.youtubeComments ?? 0) +
        (p.metaComments ?? 0) +
        (p.tiktokComments ?? 0);
      return { ...p, totalViews, totalLikes, totalComments };
    })
    .sort((a, b) => b.totalViews - a.totalViews);

  const totalViews = published.reduce((sum, p) => sum + p.totalViews, 0);
  const totalLikes = published.reduce((sum, p) => sum + p.totalLikes, 0);
  const totalComments = published.reduce((sum, p) => sum + p.totalComments, 0);

  // 100% baseline for leaderboard bars. Division-by-zero safe.
  const maxViews = published.reduce(
    (max, p) => Math.max(max, p.totalViews),
    0
  );

  const metrics = [
    { label: "TOTAL VIEWS", value: totalViews },
    { label: "TOTAL LIKES", value: totalLikes },
    { label: "TOTAL COMMENTS", value: totalComments },
  ];

  return (
    <Shell>
      <div className="w-full h-full p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* ─── HEADER ──────────────────────────────────── */}
          <div className="mb-12">
            <h1 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
              Performance
            </h1>
            <div className="flex items-center gap-4 w-full flex-wrap">
              <div className="text-2xl font-bold text-white uppercase tracking-widest">
                Performance Analytics
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <SyncButton platform="youtube" />
                <SyncButton platform="meta" />
                <SyncButton platform="tiktok" />
              </div>
            </div>
            <div className="text-xs font-mono text-gray-500 mt-1">
              {published.length} {published.length === 1 ? "video" : "videos"} published
            </div>
          </div>

          {/* ─── Aggregate Metrics ───────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="bg-[#0a0a0a] border border-white/10 p-6 flex flex-col"
              >
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {m.label}
                </span>
                <span className="text-4xl font-mono text-white tracking-widest mt-2">
                  {formatNumber(m.value)}
                </span>
              </div>
            ))}
          </div>

          {/* ─── Top Performers (Bar-Chart Leaderboard) ── */}
          <div>
            <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">
              Top Performers
            </h2>

            {published.length === 0 ? (
              <div className="border border-white/10 p-12 text-center">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  No Published Videos Yet
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {published.map((p) => {
                  const widthPct =
                    maxViews > 0 ? (p.totalViews / maxViews) * 100 : 0;
                  const tags: string[] = [];
                  if (p.youtubeId) tags.push("YT");
                  if (p.metaId) tags.push("IG");
                  if (p.tiktokId) tags.push("TT");
                  return (
                    <div key={p.id} className="mb-6 w-full">
                      {/* Row header: title + views */}
                      <div className="flex justify-between items-baseline gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {tags.length > 0 && (
                              <span className="flex gap-1 shrink-0">
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[9px] font-mono text-gray-500 border border-gray-800 px-1.5 py-0.5 uppercase tracking-widest"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </span>
                            )}
                            <span className="text-sm font-mono text-white tracking-wider truncate">
                              {p.finalTitle ?? p.title}
                            </span>
                          </div>
                          {/* Per-platform breakdown */}
                          <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
                            YT: {formatNumber(p.youtubeViews ?? 0)}
                            <span className="mx-2 text-gray-700">|</span>
                            TT: {formatNumber(p.tiktokViews ?? 0)}
                            <span className="mx-2 text-gray-700">|</span>
                            IG: {formatNumber(p.metaViews ?? 0)}
                          </span>
                          {/* Publish date + likes/comments roll-up */}
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                            {formatDate(p.publishedAt ?? p.publishDate)}
                            <span className="mx-2 text-gray-700">|</span>
                            {formatNumber(p.totalLikes)} LIKES
                            <span className="mx-2 text-gray-700">|</span>
                            {formatNumber(p.totalComments)} COMMENTS
                          </span>
                        </div>
                        <span className="text-sm font-mono text-white tracking-widest shrink-0">
                          {formatNumber(p.totalViews)}
                        </span>
                      </div>

                      {/* Bar-chart hack: flat track + filled bar */}
                      <div className="w-full h-2 bg-gray-900 mt-2">
                        <div
                          className="h-full bg-white transition-all duration-1000"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
