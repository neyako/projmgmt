"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function createSponsorship(data: {
  brandName: string;
  contactEmail?: string;
  budget: number;
  status: string;
  dueDate?: string | null;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const sponsorship = await prisma.sponsorship.create({
      data: {
        brandName: data.brandName,
        contactEmail: data.contactEmail || null,
        budget: data.budget,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
      },
    });
    revalidatePath("/sponsorships");
    return { success: true, data: sponsorship };
  } catch (err) {
    console.error("[createSponsorship]", err);
    return { success: false, error: "Failed to create sponsorship." };
  }
}

export async function updateSponsorship(id: string, data: {
  brandName?: string;
  contactEmail?: string;
  budget?: number;
  status?: string;
  dueDate?: string | null;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const sponsorship = await prisma.sponsorship.update({
      where: { id },
      data: {
        ...(data.brandName !== undefined && { brandName: data.brandName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });
    revalidatePath("/sponsorships");
    return { success: true, data: sponsorship };
  } catch (err) {
    console.error("[updateSponsorship]", err);
    return { success: false, error: "Failed to update sponsorship." };
  }
}

export async function deleteSponsorship(id: string): Promise<ActionResult> {
  try {
    await prisma.sponsorship.delete({ where: { id } });
    revalidatePath("/sponsorships");
    return { success: true, data: null };
  } catch (err) {
    console.error("[deleteSponsorship]", err);
    return { success: false, error: "Failed to delete sponsorship." };
  }
}