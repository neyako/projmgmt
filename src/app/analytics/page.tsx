import Shell from "@/components/layout/Shell";
import SyncButton from "@/components/analytics/SyncButton";
import PerformanceChart, {
  type DayPoint,
} from "@/components/analytics/PerformanceChart";
import PlatformBadge from "@/components/analytics/PlatformBadge";
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

function normPlatform(p: string): "youtube" | "meta" | "tiktok" | null {
  const u = p.toUpperCase();
  if (u === "YOUTUBE" || u === "YT_SHORTS") return "youtube";
  if (u === "FACEBOOK" || u === "META" || u === "INSTAGRAM") return "meta";
  if (u === "TIKTOK") return "tiktok";
  return null;
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Build trendline series. Per (project, platform) pair: anchor 0 at
// publishedAt and current views at today, plus any real Analytics snapshots
// in between (which override anchors on matching dates). Forward-filled and
// summed across projects → guaranteed ≥2 points so a line always draws.
async function buildTimeSeries(): Promise<DayPoint[]> {
  const [analytics, projects] = await Promise.all([
    prisma.analytics.findMany({
      select: { projectId: true, platform: true, views: true, fetchedAt: true },
      orderBy: { fetchedAt: "asc" },
    }),
    prisma.project.findMany({
      where: { status: "Published" },
      select: {
        id: true,
        publishedAt: true,
        publishDate: true,
        createdAt: true,
        youtubeViews: true,
        metaViews: true,
        tiktokViews: true,
      },
    }),
  ]);

  const todayKey = toDateKey(new Date());

  // pairKey = `${projectId}|${platform}` → date → views
  const pairPoints = new Map<string, Map<string, number>>();
  const ensure = (k: string) => {
    if (!pairPoints.has(k)) pairPoints.set(k, new Map());
    return pairPoints.get(k)!;
  };

  // Anchors from current project state.
  for (const p of projects) {
    const start = p.publishedAt ?? p.publishDate ?? p.createdAt;
    const startKey = toDateKey(start);
    const slots: ["youtube" | "meta" | "tiktok", number][] = [
      ["youtube", p.youtubeViews ?? 0],
      ["meta", p.metaViews ?? 0],
      ["tiktok", p.tiktokViews ?? 0],
    ];
    for (const [plat, current] of slots) {
      if (current === 0) continue;
      const m = ensure(`${p.id}|${plat}`);
      if (!m.has(startKey)) m.set(startKey, 0);
      m.set(todayKey, current);
    }
  }

  // Real snapshots override / augment anchors.
  for (const r of analytics) {
    const plat = normPlatform(r.platform);
    if (!plat) continue;
    ensure(`${r.projectId}|${plat}`).set(toDateKey(r.fetchedAt), r.views);
  }

  if (pairPoints.size === 0) return [];

  // Union of all dates.
  const dateSet = new Set<string>();
  for (const m of pairPoints.values())
    for (const d of m.keys()) dateSet.add(d);
  const dates = [...dateSet].sort();

  // Pre-sort each pair's snapshots ascending for forward-fill.
  const pairSorted = new Map<string, { date: string; views: number }[]>();
  for (const [k, m] of pairPoints) {
    const arr = [...m.entries()].map(([date, views]) => ({ date, views }));
    arr.sort((a, b) => a.date.localeCompare(b.date));
    pairSorted.set(k, arr);
  }

  return dates.map((d) => {
    const totals = { youtube: 0, meta: 0, tiktok: 0 };
    for (const [k, snaps] of pairSorted) {
      const plat = k.split("|")[1] as "youtube" | "meta" | "tiktok";
      let v = 0;
      let started = false;
      for (const s of snaps) {
        if (s.date <= d) {
          v = s.views;
          started = true;
        } else break;
      }
      if (started) totals[plat] += v;
    }
    return { date: d, ...totals };
  });
}

export default async function AnalyticsPage() {
  const [publishedRaw, timeSeries] = await Promise.all([
    prisma.project.findMany({ where: { status: "Published" } }),
    buildTimeSeries(),
  ]);

  const tiktokHandle = process.env.TIKTOK_HANDLE || "neyakowo";

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
              <span className="mx-2 text-text-disabled">·</span>
              auto-sync daily 00:05
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

          {/* ─── Cross-Platform Time-Series Chart ────────── */}
          <div className="mb-8 md:mb-12">
            <PerformanceChart points={timeSeries} />
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
                  const hasYoutube =
                    Boolean(p.youtubeId) ||
                    hasPlatform(p.platforms, ["YOUTUBE", "YT_SHORTS"]);
                  const hasTikTok =
                    Boolean(p.tiktokId) || hasPlatform(p.platforms, ["TIKTOK"]);
                  const hasFacebook =
                    Boolean(p.metaId) ||
                    hasPlatform(p.platforms, ["FACEBOOK", "META", "INSTAGRAM"]);

                  const rowMetrics: string[] = [];
                  if (hasYoutube)
                    rowMetrics.push(`YT: ${formatNumber(p.youtubeViews ?? 0)}`);
                  if (hasTikTok)
                    rowMetrics.push(`TT: ${formatNumber(p.tiktokViews ?? 0)}`);
                  if (hasFacebook)
                    rowMetrics.push(`FB: ${formatNumber(p.metaViews ?? 0)}`);
                  const metricString =
                    rowMetrics.length > 0
                      ? rowMetrics.join(" | ")
                      : "NO PLATFORM DATA";

                  const isShortForm = hasPlatform(p.platforms, [
                    "TIKTOK",
                    "YT_SHORTS",
                    "FACEBOOK",
                    "META",
                    "INSTAGRAM",
                  ]);
                  const isLongForm = hasPlatform(p.platforms, ["YOUTUBE"]);

                  return (
                    <div key={p.id} className="mb-6 w-full">
                      {/* Row header: title + views */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-4">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="flex gap-1 shrink-0">
                              {hasYoutube && (
                                <PlatformBadge
                                  platform="youtube"
                                  id={p.youtubeId}
                                  tiktokHandle={tiktokHandle}
                                />
                              )}
                              {hasTikTok && (
                                <PlatformBadge
                                  platform="tiktok"
                                  id={p.tiktokId}
                                  tiktokHandle={tiktokHandle}
                                />
                              )}
                              {hasFacebook && (
                                <PlatformBadge
                                  platform="facebook"
                                  id={p.metaId}
                                  tiktokHandle={tiktokHandle}
                                />
                              )}
                            </span>
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
