"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UploadAvatarResult =
  | { success: true }
  | { success: false; error: string };

type ProjectScriptResult =
  | { success: true }
  | { success: false; error: string };

export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated." };
    }

    const file = formData.get("avatar") as File | null;

    if (!file || file.size === 0) {
      return { success: false, error: "Avatar file is required." };
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Only image files are allowed." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
    const safeOwner = (session.user.username || session.user.id).replace(/[^a-zA-Z0-9.-]/g, "");
    const filename = `${safeOwner}-${Date.now()}-${safeOriginalName || "avatar"}`;
    const avatarsDir = path.join(process.cwd(), "public", "avatars");

    await fs.mkdir(avatarsDir, { recursive: true });
    await fs.writeFile(path.join(avatarsDir, filename), buffer);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: `/avatars/${filename}` },
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
  } catch (err) {
    console.error("[uploadAvatar]", err);
    return { success: false, error: "Failed to upload avatar." };
  }
}

export async function updateProjectScript(
  projectId: string,
  content: string
): Promise<ProjectScriptResult> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { script: content },
    });

    revalidatePath("/pipeline");
    revalidatePath("/archive");

    return { success: true };
  } catch (err) {
    console.error("[updateProjectScript]", err);
    return { success: false, error: "Failed to save script." };
  }
}
