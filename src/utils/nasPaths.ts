export function generateNasPaths(
  folderName: string,
  status: string,
  publishDate?: Date | string | null
) {
  const nasIp = process.env.NEXT_PUBLIC_NAS_IP ?? "";
  const nasShare = process.env.NEXT_PUBLIC_NAS_SHARE ?? "";
  const nasRootDir = process.env.NEXT_PUBLIC_NAS_ROOT_DIR ?? "";

  let subDir = "Working";
  if (status === "Published") {
    const date = publishDate ? new Date(publishDate) : new Date();
    subDir = `Done/${date.getFullYear()}`;
  } else if (status === "Draft") {
    subDir = "Draft";
  }

  const cleanRootDir = nasRootDir.replace(/^\/+|\/+$/g, "");
  const cleanSubDir = subDir.replace(/^\/+|\/+$/g, "");
  const cleanFolderName = folderName.replace(/^\/+|\/+$/g, "");
  const parts = [nasShare, cleanRootDir, cleanSubDir, cleanFolderName].filter(Boolean);
  const macPath = `smb://${nasIp}/${parts.join("/")}`;
  const winPath = `\\\\${nasIp}\\${parts
    .map((part) => part.replace(/\//g, "\\"))
    .join("\\")}`;

  return { macPath, winPath };
}
