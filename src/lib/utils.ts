// ─── CLASS NAME UTILITY ─────────────────────────────────
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── DATE FORMATTING ────────────────────────────────────
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0].replace(/-/g, ".");
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── NUMBER FORMATTING ─────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

// ─── PLATFORM PARSING ───────────────────────────────────
export function parsePlatforms(json: string): string[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

// ─── GENERATE PROJECT ID ────────────────────────────────
let counter = 0;
export function generateProjectCode(): string {
  counter++;
  return `#P-${String(counter).padStart(3, "0")}`;
}
