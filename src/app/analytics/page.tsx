import Shell from "@/components/layout/Shell";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export default async function AnalyticsPage() {
  // Fetch aggregated analytics
  const analytics = await prisma.analytics.findMany({
    orderBy: { fetchedAt: "desc" },
  });

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
  const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);

  const metrics = [
    {
      label: "TOTAL VIEWS",
      value: formatNumber(totalViews || 4200000),
      icon: "visibility",
      trend: "+12.4%",
      trendUp: true,
    },
    {
      label: "RETENTION",
      value: "68%",
      icon: "hourglass_top",
      trend: "+2.1%",
      trendUp: true,
    },
    {
      label: "REVENUE",
      value: `$${formatNumber(12400)}`,
      icon: "payments",
      trend: "-1.4%",
      trendUp: false,
    },
  ];

  return (
    <Shell>
      <div className="flex-1 overflow-y-auto bg-black p-xl">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-3xl">
          {/* Context Header */}
          <div className="flex items-end justify-between border-b border-border pb-lg">
            <div>
              <h2 className="text-style-heading text-text-display mb-xs">
                GLOBAL PERFORMANCE
              </h2>
              <p className="text-style-caption text-text-secondary uppercase">
                SYS_TIME:{" "}
                <span className="text-text-primary">
                  {new Date().toISOString().split("T")[0].replace(/-/g, ".")}{" "}
                  {new Date().toISOString().split("T")[1].slice(0, 5)}Z
                </span>
              </p>
            </div>
            <div className="flex gap-md text-style-label text-text-secondary">
              <span className="text-text-primary border-b border-text-primary pb-xs cursor-pointer">
                [ 30D ]
              </span>
              <span className="cursor-pointer hover:text-text-primary pb-xs">
                [ 90D ]
              </span>
              <span className="cursor-pointer hover:text-text-primary pb-xs">
                [ YTD ]
              </span>
            </div>
          </div>

          {/* Hero Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="bg-surface p-xl flex flex-col justify-between min-h-[240px]"
              >
                <div className="flex justify-between items-start">
                  <span className="text-style-label text-text-secondary tracking-widest">
                    {m.label}
                  </span>
                  <span className="material-symbols-outlined text-text-secondary text-[16px]">
                    {m.icon}
                  </span>
                </div>
                <div>
                  <div className="text-style-display-xl text-text-display leading-none mb-sm">
                    {m.value}
                  </div>
                  <div className="flex items-center gap-xs text-style-caption">
                    <span
                      className={`material-symbols-outlined text-[14px] ${m.trendUp ? "text-success" : "text-accent"}`}
                    >
                      {m.trendUp ? "arrow_upward" : "arrow_downward"}
                    </span>
                    <span className={m.trendUp ? "text-success" : "text-accent"}>
                      {m.trend}
                    </span>
                    <span className="text-text-secondary ml-sm">
                      VS PREV PERIOD
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Segmented Goal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3xl">
            <div className="flex flex-col gap-lg">
              <div className="flex justify-between items-end border-b border-border pb-sm">
                <span className="text-style-label text-text-display tracking-widest">
                  MONTHLY GOAL: 10M VIEWS
                </span>
                <span className="text-style-caption text-text-secondary">
                  72%
                </span>
              </div>
              <div className="flex gap-[2px] h-12 w-full">
                {Array.from({ length: 14 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${i < 10 ? "bg-text-display" : "border border-border-visible bg-transparent"}`}
                  />
                ))}
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="flex flex-col gap-lg">
              <div className="flex justify-between items-end border-b border-border pb-sm">
                <span className="text-style-label text-text-display tracking-widest">
                  PLATFORM DISTRIBUTION
                </span>
                <span className="material-symbols-outlined text-text-secondary text-[16px]">
                  share
                </span>
              </div>
              <div className="flex flex-col gap-md pt-sm">
                {[
                  { name: "TIKTOK", pct: 55 },
                  { name: "YT SHORTS", pct: 30 },
                  { name: "INSTAGRAM", pct: 15 },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-md">
                    <span className="text-style-caption text-text-primary w-24">
                      {p.name}
                    </span>
                    <div className="flex-1 h-[24px] relative flex items-center">
                      <div
                        className="absolute h-[1.5px] bg-text-display left-0 top-1/2 -translate-y-1/2"
                        style={{ width: `${p.pct}%` }}
                      />
                      <div className="absolute w-full h-[1px] bg-border-visible left-0 top-1/2 -translate-y-1/2 -z-10" />
                    </div>
                    <span className="text-style-caption text-text-secondary w-16 text-right">
                      {p.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
