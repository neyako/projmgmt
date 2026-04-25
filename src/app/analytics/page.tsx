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

function parsePlatformTags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((p) => typeof p === "string").map((p) => p.toUpperCase())
      : [];
  } catch {
    return [];
  }
}

function hasPlatform(platforms: string[], names: string[]) {
  return names.some((name) => platforms.includes(name));
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
      return {
        ...p,
        platforms: parsePlatformTags(p.platformsTargeted),
        totalViews,
        totalLikes,
        totalComments,
      };
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
      <div className="w-full h-full p-4 md:p-lg overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* ─── HEADER ──────────────────────────────────── */}
          <div className="mb-8 md:mb-12">
            <h1 className="ui-page-kicker mb-1">Performance</h1>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 w-full">
              <div className="ui-page-title text-xl md:text-2xl">
                Performance Analytics
              </div>
              <div className="flex items-center gap-2 flex-wrap lg:ml-auto">
                <SyncButton platform="youtube" />
                <SyncButton platform="meta" />
                <SyncButton platform="tiktok" />
              </div>
            </div>
            <div className="ui-page-meta mt-1">
              {published.length} {published.length === 1 ? "video" : "videos"} published
            </div>
          </div>

          {/* ─── Aggregate Metrics ───────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-8 md:mb-12">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="ui-panel p-4 md:p-5 lg:p-6 flex flex-col min-w-0"
              >
                <span className="ui-page-kicker">
                  {m.label}
                </span>
                <span className="font-mono text-text-display tabular-nums tracking-tight md:tracking-wide lg:tracking-widest mt-2 text-2xl md:text-[1.75rem] lg:text-4xl break-all leading-none">
                  {formatNumber(m.value)}
                </span>
              </div>
            ))}
          </div>

          {/* ─── Top Performers (Bar-Chart Leaderboard) ── */}
          <div>
            <h2 className="ui-page-kicker mb-6">
              Top Performers
            </h2>

            {published.length === 0 ? (
              <div className="ui-panel p-12 text-center">
                <div className="ui-page-kicker">
                  No Published Videos Yet
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {published.map((p) => {
                  const widthPct =
                    maxViews > 0 ? (p.totalViews / maxViews) * 100 : 0;
                  const hasYoutube = Boolean(p.youtubeId) || hasPlatform(p.platforms, ["YOUTUBE", "YT_SHORTS"]);
                  const hasTikTok = Boolean(p.tiktokId) || hasPlatform(p.platforms, ["TIKTOK"]);
                  const hasInstagram = Boolean(p.metaId) || hasPlatform(p.platforms, ["INSTAGRAM", "META"]);

                  const tags: string[] = [];
                  if (hasYoutube) tags.push("YT");
                  if (hasInstagram) tags.push("IG");
                  if (hasTikTok) tags.push("TT");

                  const rowMetrics: string[] = [];
                  if (hasYoutube) rowMetrics.push(`YT: ${formatNumber(p.youtubeViews ?? 0)}`);
                  if (hasTikTok) rowMetrics.push(`TT: ${formatNumber(p.tiktokViews ?? 0)}`);
                  if (hasInstagram) rowMetrics.push(`IG: ${formatNumber(p.metaViews ?? 0)}`);
                  const metricString = rowMetrics.length > 0 ? rowMetrics.join(" | ") : "NO PLATFORM DATA";

                  const isShortForm = hasPlatform(p.platforms, ["TIKTOK", "YT_SHORTS", "INSTAGRAM", "META"]);
                  const isLongForm = hasPlatform(p.platforms, ["YOUTUBE"]);

                  return (
                    <div key={p.id} className="mb-6 w-full">
                      {/* Row header: title + views */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            {tags.length > 0 && (
                              <span className="flex gap-1 shrink-0">
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="ui-tag-muted px-1.5 py-0.5"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </span>
                            )}
                            <span className="text-sm font-mono text-text-display tracking-wider break-words min-w-0 flex-1">
                              {p.finalTitle ?? p.title}
                            </span>
                            {isShortForm && (
                              <span className="px-1.5 py-0.5 border border-border-visible text-text-secondary text-[9px] uppercase rounded shrink-0">
                                Short Form
                              </span>
                            )}
                            {isLongForm && (
                              <span className="px-1.5 py-0.5 border border-border-visible text-text-secondary text-[9px] uppercase rounded shrink-0">
                                Long Form
                              </span>
                            )}
                          </div>
                          {/* Per-platform breakdown */}
                          <span className="text-[9px] font-mono text-text-secondary mt-1 uppercase tracking-widest break-words">
                            {metricString}
                          </span>
                          {/* Publish date + likes/comments roll-up */}
                          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-1 flex flex-wrap gap-x-2 gap-y-0">
                            <span>{formatDate(p.publishedAt ?? p.publishDate)}</span>
                            <span className="text-text-disabled">|</span>
                            <span className="tabular-nums">{formatNumber(p.totalLikes)} LIKES</span>
                            <span className="text-text-disabled">|</span>
                            <span className="tabular-nums">{formatNumber(p.totalComments)} COMMENTS</span>
                          </span>
                        </div>
                        <span className="text-sm font-mono text-text-display tracking-wider tabular-nums shrink-0 sm:text-right">
                          {formatNumber(p.totalViews)}
                        </span>
                      </div>

                      {/* Bar-chart hack: flat track + filled bar */}
                      <div className="w-full h-2 ui-bar-track mt-2">
                        <div
                          className="h-full ui-bar-fill transition-all duration-1000"
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
