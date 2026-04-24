"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function changePassword(
  currentPass: string,
  newPass: string
): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated." };
    }

    if (!currentPass || !newPass) {
      return { success: false, error: "Current and new password are required." };
    }

    if (newPass.length < 8) {
      return { success: false, error: "New password must be at least 8 characters." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return { success: false, error: "No password found for this account." };
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPass, user.passwordHash);

    if (!isValidCurrentPassword) {
      return { success: false, error: "Current password is invalid." };
    }

    const newPasswordHash = await bcrypt.hash(newPass, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (err) {
    console.error("[changePassword]", err);
    return { success: false, error: "Failed to update password." };
  }
}
