import { prisma } from "@/lib/prisma";
import {
  DEFAULT_APPLICATION_SETTINGS,
  normalizeWorkspaceId,
  normalizeContentTypeOptions,
  type ApplicationSettings,
  type ContentTypeOption,
} from "@/lib/appSettingsConfig";

const PUBLIC_URL_KEY = "publicUrl";
const CONTENT_TYPES_KEY = "contentTypes";
const WORKSPACE_ID_KEY = "workspaceId";

type HeaderReader = {
  get(name: string): string | null;
};

function isMissingSettingsTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function ensureAppSettingsTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "AppSetting" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export function normalizePublicAppUrl(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: "" };

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "Public URL must use HTTP or HTTPS." };
    }
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return { ok: true, value: url.toString().replace(/\/+$/, "") };
  } catch {
    return { ok: false, error: "Public URL is invalid." };
  }
}

export function getPublicAppUrlFromHeaders(headers: HeaderReader): string | null {
  const host = (headers.get("x-forwarded-host") || headers.get("host"))
    ?.split(",")[0]
    ?.trim();
  if (!host) return null;
  const proto =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const normalized = normalizePublicAppUrl(`${proto}://${host}`);
  return normalized.ok ? normalized.value : null;
}

function parseContentTypes(value?: string | null): ContentTypeOption[] {
  if (!value) return DEFAULT_APPLICATION_SETTINGS.contentTypes;
  try {
    return normalizeContentTypeOptions(JSON.parse(value));
  } catch {
    return DEFAULT_APPLICATION_SETTINGS.contentTypes;
  }
}

function getDefaultWorkspaceId(): string {
  return normalizeWorkspaceId(process.env.WORKSPACE_ID) || DEFAULT_APPLICATION_SETTINGS.workspaceId;
}

export async function getApplicationSettings(): Promise<ApplicationSettings> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: [PUBLIC_URL_KEY, CONTENT_TYPES_KEY, WORKSPACE_ID_KEY] } },
    });
    const values = new Map(rows.map((row) => [row.key, row.value]));

    return {
      publicUrl: values.get(PUBLIC_URL_KEY) ?? DEFAULT_APPLICATION_SETTINGS.publicUrl,
      workspaceId:
        normalizeWorkspaceId(values.get(WORKSPACE_ID_KEY)) || getDefaultWorkspaceId(),
      contentTypes: parseContentTypes(values.get(CONTENT_TYPES_KEY)),
    };
  } catch (error) {
    if (!isMissingSettingsTable(error)) {
      console.error("[getApplicationSettings]", error);
    }
    return DEFAULT_APPLICATION_SETTINGS;
  }
}

export async function getConfiguredPublicAppUrl(): Promise<string | null> {
  const settings = await getApplicationSettings();
  return settings.publicUrl || null;
}

export async function getWorkspaceId(): Promise<string> {
  const settings = await getApplicationSettings();
  return settings.workspaceId;
}

export async function saveWorkspaceId(input: string) {
  const workspaceId = normalizeWorkspaceId(input) || getDefaultWorkspaceId();

  try {
    await prisma.appSetting.upsert({
      where: { key: WORKSPACE_ID_KEY },
      update: { value: workspaceId },
      create: { key: WORKSPACE_ID_KEY, value: workspaceId },
    });
  } catch (error) {
    if (isMissingSettingsTable(error)) {
      await ensureAppSettingsTable();
      await prisma.appSetting.upsert({
        where: { key: WORKSPACE_ID_KEY },
        update: { value: workspaceId },
        create: { key: WORKSPACE_ID_KEY, value: workspaceId },
      });
      return workspaceId;
    }
    throw error;
  }

  return workspaceId;
}

export async function saveApplicationSettings(
  input: Pick<ApplicationSettings, "publicUrl" | "contentTypes">
) {
  const publicUrl = normalizePublicAppUrl(input.publicUrl);
  if (!publicUrl.ok) {
    return { success: false as const, error: publicUrl.error };
  }

  const contentTypes = normalizeContentTypeOptions(input.contentTypes);
  if (contentTypes.length === 0) {
    return { success: false as const, error: "At least one content type is required." };
  }

  const settings: ApplicationSettings = {
    publicUrl: publicUrl.value,
    workspaceId: (await getApplicationSettings()).workspaceId,
    contentTypes,
  };

  const writeSettings = () =>
    prisma.$transaction([
      prisma.appSetting.upsert({
        where: { key: PUBLIC_URL_KEY },
        update: { value: settings.publicUrl },
        create: { key: PUBLIC_URL_KEY, value: settings.publicUrl },
      }),
      prisma.appSetting.upsert({
        where: { key: CONTENT_TYPES_KEY },
        update: { value: JSON.stringify(settings.contentTypes) },
        create: { key: CONTENT_TYPES_KEY, value: JSON.stringify(settings.contentTypes) },
      }),
    ]);

  try {
    await writeSettings();
  } catch (error) {
    if (isMissingSettingsTable(error)) {
      try {
        await ensureAppSettingsTable();
        await writeSettings();
        return { success: true as const, settings };
      } catch (retryError) {
        console.error("[saveApplicationSettings:retry]", retryError);
      }
    }

    console.error("[saveApplicationSettings]", error);
    return {
      success: false as const,
      error: "Failed to save application settings.",
    };
  }

  return { success: true as const, settings };
}
