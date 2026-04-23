// Cron scheduler — runs daily at midnight for analytics fetching
import cron from "node-cron";
import { prisma } from "@/lib/prisma";

export function initCronJobs() {
  // Daily analytics fetch at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily analytics fetch...");
    try {
      const publishedProjects = await prisma.project.findMany({
        where: { status: "Published" },
      });
      for (const project of publishedProjects) {
        const platforms = JSON.parse(project.platformsTargeted || "[]");
        for (const platform of platforms) {
          // Stub: In production, call the appropriate service
          console.log(`[CRON] Fetching ${platform} stats for: ${project.title}`);
        }
      }
      console.log(`[CRON] Processed ${publishedProjects.length} projects.`);
    } catch (err) {
      console.error("[CRON] Error:", err);
    }
  });
  console.log("[CRON] Analytics scheduler initialized (daily @ midnight)");
}
