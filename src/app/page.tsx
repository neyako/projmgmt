import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    redirect("/setup");
  }

  redirect("/pipeline");
}
