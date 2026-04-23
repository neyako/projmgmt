"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function createUser(data: {
  name: string;
  email: string;
  role: string;
}): Promise<ActionResult> {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
      },
    });
    revalidatePath("/team");
    return { success: true, data: user };
  } catch (err) {
    console.error("[createUser]", err);
    return { success: false, error: "Failed to create user." };
  }
}

export async function updateUser(id: string, data: {
  name?: string;
  email?: string;
  role?: string;
}): Promise<ActionResult> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
      },
    });
    revalidatePath("/team");
    return { success: true, data: user };
  } catch (err) {
    console.error("[updateUser]", err);
    return { success: false, error: "Failed to update user." };
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/team");
    return { success: true, data: null };
  } catch (err) {
    console.error("[deleteUser]", err);
    return { success: false, error: "Failed to delete user." };
  }
}