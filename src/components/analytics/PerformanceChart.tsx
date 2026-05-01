"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";

export type DayPoint = {
  date: string; // YYYY-MM-DD
  youtube: number;
  meta: number;
  tiktok: number;
};

type Range = "30d" | "90d" | "1y" | "lifetime";

const RANGES: { key: Range; labelKey: string; days: number | null }[] = [
  { key: "30d", labelKey: "analytics.ranges.30d", days: 30 },
  { key: "90d", labelKey: "analytics.ranges.90d", days: 90 },
  { key: "1y", labelKey: "analytics.ranges.1y", days: 365 },
  { key: "lifetime", labelKey: "analytics.ranges.lifetime", days: null },
];

const PLATFORM_META = [
  { key: "youtube" as const, label: "YOUTUBE", color: "#FF0033" },
  { key: "meta" as const, label: "FACEBOOK", color: "#1877F2" },
  { key: "tiktok" as const, label: "TIKTOK", color: "#FF3B5C" },
];

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toUpperCase();
}

type PlatKey = "youtube" | "meta" | "tiktok";

export default function PerformanceChart({ points }: { points: DayPoint[] }) {
  const t = useT();
  const [range, setRange] = useState<Range>("90d");
  const [hover, setHover] = useState<number | null>(null);
  const [visible, setVisible] = useState<Set<PlatKey>>(
    new Set(["youtube", "meta", "tiktok"])
  );

  function togglePlat(k: PlatKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        if (next.size === 1) {
          // Click last visible plat = restore all
          return new Set(["youtube", "meta", "tiktok"]);
        }
        next.delete(k);
      } else {
        next.add(k);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    if (points.length === 0) return [];
    const cfg = RANGES.find((r) => r.key === range)!;
    if (cfg.days === null) return points;
    const cutoff = Date.now() - cfg.days * 24 * 60 * 60 * 1000;
    return points.filter(
      (p) => new Date(p.date + "T00:00:00Z").getTime() >= cutoff
    );
  }, [points, range]);

  const max = useMemo(() => {
    let m = 0;
    for (const p of filtered) {
      if (visible.has("youtube") && p.youtube > m) m = p.youtube;
      if (visible.has("meta") && p.meta > m) m = p.meta;
      if (visible.has("tiktok") && p.tiktok > m) m = p.tiktok;
    }
    return m === 0 ? 1 : m;
  }, [filtered, visible]);

  // SVG layout — Y-axis labels live in a separate HTML column outside the
  // SVG, so PAD_L only reserves space for plot stroke clearance. PAD_B is
  // the band where X-axis HTML overlay labels sit.
  const W = 1000;
  const H = 320;
  const PAD_L = 12;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 36;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xAt = (i: number) =>
    filtered.length <= 1
      ? PAD_L + innerW / 2
      : PAD_L + (i / (filtered.length - 1)) * innerW;
  const yAt = (v: number) => PAD_T + innerH - (v / max) * innerH;

  const linePath = (key: "youtube" | "meta" | "tiktok") => {
    if (filtered.length === 0) return "";
    return filtered
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p[key])}`)
      .join(" ");
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xTicks = (() => {
    if (filtered.length === 0) return [];
    // Cap to ~5 ticks max so labels don't crowd on narrow viewports.
    const TARGET = 5;
    const step = Math.max(1, Math.ceil(filtered.length / TARGET));
    const ticks: number[] = [];
    for (let i = 0; i < filtered.length; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== filtered.length - 1)
      ticks.push(filtered.length - 1);
    return ticks;
  })();

  // Legend totals = latest point in range
  const latest = filtered[filtered.length - 1];

  return (
    <div className="ui-panel p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="ui-page-kicker">{t("analytics.crossPlatform")}</span>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border ${
                range === r.key
                  ? "border-text-display text-text-display"
                  : "border-border-visible text-text-secondary hover:bg-text-display hover:text-text-inverse hover:border-text-display"
              }`}
            >
              {t(r.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PLATFORM_META.map((m) => {
          const on = visible.has(m.key);
          return (
            <button
              key={`filter-${m.key}`}
              type="button"
              onClick={() => togglePlat(m.key)}
              className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-widest border ${
                on
                  ? "border-text-display text-text-display"
                  : "border-border-visible text-text-disabled hover:bg-text-display hover:text-text-inverse hover:border-text-display"
              }`}
              title={on ? t("analytics.hide", { label: m.label }) : t("analytics.show", { label: m.label })}
            >
              <span
                className="inline-block w-2 h-2"
                style={{ backgroundColor: on ? m.color : "transparent", border: `1px solid ${m.color}` }}
              />
              {m.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center ui-page-kicker">
          {t("analytics.noSnapshots")}
        </div>
      ) : (
        <>
          <div className="flex w-full h-[260px] md:h-[320px]">
            {/* Y-axis labels — fixed-width HTML column, immune to SVG stretch */}
            <div className="relative w-12 md:w-16 shrink-0">
              {yTicks.map((t, i) => (
                <span
                  key={`y-lbl-${i}`}
                  className="absolute right-0 pr-2 font-mono uppercase tabular-nums text-text-secondary text-[10px] md:text-[11px]"
                  style={{
                    letterSpacing: "0.12em",
                    fontWeight: 500,
                    top: `${((PAD_T + innerH - (t / max) * innerH) / H) * 100}%`,
                    transform: "translateY(-50%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatNumber(Math.round(t))}
                </span>
              ))}
            </div>

            <div className="relative flex-1 min-w-0">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              onMouseLeave={() => setHover(null)}
            >
              {/* Grid lines only — labels rendered as HTML overlay below */}
              {yTicks.map((t, i) => (
                <line
                  key={`grid-${i}`}
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                />
              ))}

              {/* Lines */}
              {PLATFORM_META.filter((m) => visible.has(m.key)).map((m) => (
                <path
                  key={m.key}
                  d={linePath(m.key)}
                  fill="none"
                  stroke={m.color}
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              ))}


              {/* Hover capture columns */}
              {filtered.map((_, i) => {
                const slotW = innerW / Math.max(1, filtered.length - 1);
                return (
                  <rect
                    key={`hit-${i}`}
                    x={xAt(i) - slotW / 2}
                    y={PAD_T}
                    width={slotW}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                  />
                );
              })}

              {/* Hover marker */}
              {hover !== null && filtered[hover] && (
                <>
                  <line
                    x1={xAt(hover)}
                    x2={xAt(hover)}
                    y1={PAD_T}
                    y2={PAD_T + innerH}
                    stroke="var(--color-text-display)"
                    strokeDasharray="2 3"
                  />
                  {PLATFORM_META.filter((m) => visible.has(m.key)).map((m) => (
                    <circle
                      key={`dot-${m.key}`}
                      cx={xAt(hover)}
                      cy={yAt(filtered[hover][m.key])}
                      r="3"
                      fill={m.color}
                    />
                  ))}
                </>
              )}
            </svg>

            {/* X-axis labels — HTML overlay inside plot column */}
            {xTicks.map((i, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === xTicks.length - 1;
              return (
                <span
                  key={`x-lbl-${i}`}
                  className="absolute font-mono uppercase text-text-secondary text-[10px] md:text-[11px]"
                  style={{
                    letterSpacing: "0.12em",
                    fontWeight: 500,
                    left: `${(xAt(i) / W) * 100}%`,
                    bottom: 4,
                    transform: isFirst
                      ? "translate(0, 0)"
                      : isLast
                        ? "translate(-100%, 0)"
                        : "translate(-50%, 0)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDateLabel(filtered[i].date)}
                </span>
              );
            })}
            </div>
          </div>

          {/* Legend / current totals (also clickable to toggle) */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {PLATFORM_META.map((m) => {
              const point =
                hover !== null && filtered[hover] ? filtered[hover] : latest;
              const on = visible.has(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => togglePlat(m.key)}
                  className={`flex flex-col border-l-2 pl-3 text-left ${
                    on ? "opacity-100" : "group opacity-40 hover:bg-text-display hover:text-text-inverse"
                  }`}
                  style={{ borderLeftColor: m.color }}
                >
                  <span className="ui-page-kicker group-hover:text-text-inverse">{m.label}</span>
                  <span className="font-mono text-text-display group-hover:text-text-inverse tabular-nums tracking-wider mt-1 text-lg md:text-xl">
                    {formatNumber(point ? point[m.key] : 0)}
                  </span>
                  {hover !== null && filtered[hover] && (
                    <span className="text-[9px] font-mono text-text-secondary group-hover:text-text-inverse uppercase tracking-widest mt-0.5">
                      {formatDateLabel(filtered[hover].date)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
