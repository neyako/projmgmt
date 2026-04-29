import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "avatars", filename);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase().slice(1);
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
