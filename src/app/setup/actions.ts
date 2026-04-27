"use server";

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export type InitializeStudioResult =
  | { success: true }
  | { success: false; error: string };

export async function initializeStudio(formData: FormData): Promise<InitializeStudioResult> {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    throw new Error("Studio already initialized.");
  }

  const workspaceName = String(formData.get("workspaceName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!workspaceName || !username || !displayName || !password) {
    return { success: false, error: "ALL_FIELDS_REQUIRED" };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "PASSWORD_MISMATCH" };
  }

  if (password.length < 8) {
    return { success: false, error: "PASSWORD_TOO_SHORT" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const email = `${username}@local`;

  await prisma.user.create({
    data: {
      name: displayName,
      username,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  return { success: true };
}
