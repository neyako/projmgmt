import { createClient, type FileStat, type WebDAVClient } from "webdav";

type NextcloudConfig = {
  archivePath?: string;
  basePath: string;
  baseUrl: string;
  password: string;
  username: string;
  webDavUrl: string;
};

const NEXTCLOUD_FILE_PROPFIND = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop>
    <d:getlastmodified />
    <d:getetag />
    <d:getcontenttype />
    <d:resourcetype />
    <d:getcontentlength />
    <oc:fileid />
    <oc:comments-href />
  </d:prop>
</d:propfind>`;

let webDavClient: WebDAVClient | null = null;
let webDavClientKey: string | null = null;

function getNextcloudConfig(): NextcloudConfig | null {
  const baseUrl = process.env.NEXTCLOUD_URL?.replace(/\/+$/, "");
  const username = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;
  const basePath = process.env.NEXTCLOUD_BASE_PATH;
  const archivePath = process.env.NEXTCLOUD_ARCHIVE_PATH;

  const missing = [
    ["NEXTCLOUD_URL", baseUrl],
    ["NEXTCLOUD_USER", username],
    ["NEXTCLOUD_PASSWORD", password],
    ["NEXTCLOUD_BASE_PATH", basePath],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0 || !baseUrl || !username || !password || !basePath) {
    console.warn(`[Nextcloud] Missing configuration: ${missing.join(", ")}`);
    return null;
  }

  return {
    archivePath,
    basePath,
    baseUrl,
    password,
    username,
    webDavUrl: `${baseUrl}/remote.php/webdav`,
  };
}

function getWebDavClient(config: NextcloudConfig): WebDAVClient {
  const clientKey = `${config.webDavUrl}:${config.username}`;

  if (!webDavClient || webDavClientKey !== clientKey) {
    webDavClient = createClient(config.webDavUrl, {
      username: config.username,
      password: config.password,
    });
    webDavClientKey = clientKey;
  }

  return webDavClient;
}

function buildProjectPath(basePath: string, projectName: string): string {
  const path = `${basePath}/${projectName}`;
  const normalizedPath = path.replace(/\/+/g, "/");

  return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
}

function stripDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d");
}

function normalizeLookupName(name: string): string {
  return stripDiacritics(name).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getFileModifiedTime(file: FileStat): number {
  const parsedTime = Date.parse(file.lastmod);
  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

function getNextcloudFileId(file: FileStat): string | null {
  const rawFileId = file.props?.fileid;

  if (typeof rawFileId === "string" || typeof rawFileId === "number") {
    return String(rawFileId);
  }

  const commentsHref = file.props?.["comments-href"];

  if (typeof commentsHref === "string") {
    return commentsHref.match(/\/files\/([^/]+)$/)?.[1] ?? null;
  }

  return null;
}

function buildInternalFileLink(config: NextcloudConfig, fileId: string): string {
  return `${config.baseUrl}/f/${encodeURIComponent(fileId)}`;
}

function tokenizeName(value: string): string[] {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function matchesDraftVersion(fileName: string, projectName: string, currentVersion: number): boolean {
  const fileTokens = new Set(tokenizeName(fileName));
  const projectTokens = tokenizeName(projectName);

  if (projectTokens.length === 0) return false;
  for (const token of projectTokens) {
    if (!fileTokens.has(token)) return false;
  }

  const versionStr = String(currentVersion);
  const combined = `draft${versionStr}`;
  if (fileTokens.has(combined)) return true;
  if (fileTokens.has("draft") && fileTokens.has(versionStr)) return true;

  return false;
}

async function resolveProjectDirectory(
  client: WebDAVClient,
  basePath: string,
  projectName: string
): Promise<{ name: string; path: string } | null> {
  const exactPath = buildProjectPath(basePath, projectName);

  if (await client.exists(exactPath)) {
    return { name: projectName, path: exactPath };
  }

  const targetName = normalizeLookupName(projectName);
  const contents = await client.getDirectoryContents(basePath);
  const candidates = contents
    .filter((item) => item.type === "directory")
    .map((item) => ({
      item,
      normalizedName: normalizeLookupName(item.basename),
    }))
    .filter(({ normalizedName }) =>
      normalizedName === targetName ||
      normalizedName.includes(targetName) ||
      targetName.includes(normalizedName)
    )
    .sort((a, b) => a.item.basename.length - b.item.basename.length);

  const match = candidates[0]?.item;

  if (!match) {
    return null;
  }

  return {
    name: match.basename,
    path: match.filename || buildProjectPath(basePath, match.basename),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function provisionNextcloudFolder(projectName: string): Promise<string | null> {
  const config = getNextcloudConfig();
  const cleanProjectName = projectName.trim();

  if (!config || !cleanProjectName) {
    if (!cleanProjectName) {
      console.warn("[Nextcloud] Cannot provision folder without a project name.");
    }
    return null;
  }

  const projectPath = buildProjectPath(config.basePath, cleanProjectName);
  const client = getWebDavClient(config);

  try {
    const exists = await client.exists(projectPath);

    if (!exists) {
      await client.createDirectory(projectPath);
    }

    return projectPath;
  } catch (error) {
    console.error(`[Nextcloud] Failed to provision folder "${projectPath}": ${getErrorMessage(error)}`);
    return null;
  }
}

export async function generateDraftReviewLink(
  projectName: string,
  currentVersion: number
): Promise<string | null> {
  const config = getNextcloudConfig();
  const cleanProjectName = projectName.trim();
  const expectedVersion = Math.max(1, Math.floor(currentVersion));

  if (!config || !cleanProjectName) {
    if (!cleanProjectName) {
      console.warn("[Nextcloud] Cannot scan drafts without a project name.");
    }
    return null;
  }

  if (!Number.isFinite(currentVersion)) {
    console.warn(`[Nextcloud] Cannot scan drafts with invalid draft version: ${currentVersion}`);
    return null;
  }

  const client = getWebDavClient(config);

  try {
    const projectDirectory = await resolveProjectDirectory(client, config.basePath, cleanProjectName);

    if (!projectDirectory) {
      console.warn(`[Nextcloud] Project folder not found for "${cleanProjectName}".`);
      return null;
    }

    const contentsResponse = await client.getDirectoryContents(projectDirectory.path, {
      data: NEXTCLOUD_FILE_PROPFIND,
      details: true,
    });
    const contents = contentsResponse.data;
    const draft = contents
      .filter((item) => item.type === "file" && matchesDraftVersion(item.basename, projectDirectory.name, expectedVersion))
      .sort((a, b) => getFileModifiedTime(b) - getFileModifiedTime(a))[0];

    if (!draft) {
      return null;
    }

    const fileId = getNextcloudFileId(draft);

    if (!fileId) {
      console.warn(`[Nextcloud] WebDAV did not return a file id for "${draft.filename}".`);
      return null;
    }

    return buildInternalFileLink(config, fileId);
  } catch (error) {
    console.error(`[Nextcloud] Failed to generate draft review link for "${cleanProjectName}": ${getErrorMessage(error)}`);
    return null;
  }
}

export async function archiveNextcloudFolder(projectName: string): Promise<string | null> {
  const config = getNextcloudConfig();
  const cleanProjectName = projectName.trim();

  if (!config || !cleanProjectName) {
    if (!cleanProjectName) {
      console.warn("[Nextcloud] Cannot archive folder without a project name.");
    }
    return null;
  }

  if (!config.archivePath) {
    console.warn("[Nextcloud] Missing configuration: NEXTCLOUD_ARCHIVE_PATH");
    return null;
  }

  const currentYear = new Date().getFullYear().toString();
  const sourcePath = buildProjectPath(config.basePath, cleanProjectName);
  const yearDirPath = buildProjectPath(config.archivePath, currentYear);
  const destPath = buildProjectPath(yearDirPath, cleanProjectName);
  const client = getWebDavClient(config);

  try {
    const yearDirExists = await client.exists(yearDirPath);

    if (!yearDirExists) {
      await client.createDirectory(yearDirPath);
    }

    await client.moveFile(sourcePath, destPath);

    return destPath;
  } catch (error) {
    console.error(
      `[Nextcloud] Failed to archive folder "${sourcePath}" to "${destPath}": ${getErrorMessage(error)}`
    );
    return null;
  }
}
