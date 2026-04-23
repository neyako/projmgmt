// Nextcloud WebDAV — Auto-create project folder
export async function createNextcloudFolder(projectTitle: string): Promise<{ success: boolean; path?: string; error?: string }> {
  const baseUrl = process.env.NEXTCLOUD_URL;
  const user = process.env.NEXTCLOUD_USER;
  const password = process.env.NEXTCLOUD_PASSWORD;

  if (!baseUrl || baseUrl.includes("your-nextcloud")) {
    console.warn("[Nextcloud] Not configured, skipping folder creation.");
    return { success: false, error: "Nextcloud not configured" };
  }

  const folderName = projectTitle.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const davPath = `/remote.php/dav/files/${user}/Studio_Projects/${folderName}`;

  try {
    const res = await fetch(`${baseUrl}${davPath}`, {
      method: "MKCOL",
      headers: {
        Authorization: "Basic " + Buffer.from(`${user}:${password}`).toString("base64"),
      },
    });

    if (res.ok || res.status === 405) {
      // 405 = folder already exists
      return { success: true, path: `${baseUrl}${davPath}` };
    }
    return { success: false, error: `WebDAV returned ${res.status}` };
  } catch (err) {
    console.error("[Nextcloud] WebDAV error:", err);
    return { success: false, error: String(err) };
  }
}
