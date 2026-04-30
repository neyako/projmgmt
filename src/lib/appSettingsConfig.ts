import type { Locale } from "@/lib/i18n/locales";

export type ContentTypeOption = {
  value: string;
  labelEn: string;
  labelVi: string;
};

export type ApplicationSettings = {
  publicUrl: string;
  workspaceId: string;
  contentTypes: ContentTypeOption[];
};

export const DEFAULT_CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  { value: "Organic", labelEn: "Organic", labelVi: "Tự nhiên" },
  { value: "Sponsored", labelEn: "Sponsored", labelVi: "Tài trợ" },
  { value: "Product_Seeding", labelEn: "Product Seeding", labelVi: "Gửi sản phẩm" },
];

export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
  publicUrl: "",
  workspaceId: "LOCAL_STUDIO",
  contentTypes: DEFAULT_CONTENT_TYPE_OPTIONS,
};

export function normalizeWorkspaceId(value: string | null | undefined): string {
  return (value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 40);
}

export function formatWorkspaceDisplayName(value: string | null | undefined): string {
  return (
    normalizeWorkspaceId(value)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() ||
    DEFAULT_APPLICATION_SETTINGS.workspaceId.replace(/[_-]+/g, " ")
  );
}

export function normalizeContentTypeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 40);
}

export function humanizeContentTypeValue(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeContentTypeOptions(input: unknown): ContentTypeOption[] {
  if (!Array.isArray(input)) return DEFAULT_CONTENT_TYPE_OPTIONS;

  const seen = new Set<string>();
  const normalized: ContentTypeOption[] = [];

  for (const item of input.slice(0, 24)) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Partial<Record<keyof ContentTypeOption, unknown>>;
    const value = normalizeContentTypeValue(String(raw.value ?? ""));
    if (!value || seen.has(value)) continue;

    const fallback = humanizeContentTypeValue(value);
    const labelEn = String(raw.labelEn ?? "").trim() || fallback;
    const labelVi = String(raw.labelVi ?? "").trim() || labelEn;

    normalized.push({
      value,
      labelEn: labelEn.slice(0, 60),
      labelVi: labelVi.slice(0, 60),
    });
    seen.add(value);
  }

  return normalized.length > 0 ? normalized : DEFAULT_CONTENT_TYPE_OPTIONS;
}

export function getContentTypeLabel(
  options: ContentTypeOption[],
  value: string,
  locale: Locale
): string {
  const option = options.find((item) => item.value === value);
  if (!option) return humanizeContentTypeValue(value);
  return locale === "vi" ? option.labelVi : option.labelEn;
}
