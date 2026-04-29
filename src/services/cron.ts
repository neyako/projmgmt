// Cron scheduler — daily analytics fetching with TikTok quota rotation.
import cron from "node-cron";
import {
  syncYouTubeStats,
  syncMetaStats,
  syncTikTokStatsBatch,
} from "@/actions/projects";
import { syncCurrencyRates } from "@/lib/currencyRates";

// TikTok RapidAPI quota: 100/mo. 3/day = ~90/mo with headroom.
const TIKTOK_DAILY_LIMIT = parseInt(
  process.env.TIKTOK_DAILY_SYNC_LIMIT || "3",
  10
);

let started = false;

export function initCronJobs() {
  if (started) return;
  started = true;

  void syncCurrencyRates().then((result) => {
    if (result.success) {
      console.log(`[CRON] Currency rates warmed (${result.count} pairs)`);
    } else {
      console.error("[CRON] Currency warmup failed", result.error);
    }
  });

  // Daily at 00:00 server time. ExchangeRate-API open access updates daily.
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Currency rate sync starting...");
    const result = await syncCurrencyRates();
    if (result.success) {
      console.log(`[CRON] Currency rates synced (${result.count} pairs)`);
    } else {
      console.error("[CRON] Currency sync failed", result.error);
    }
  });

  // Daily at 00:05 server time. YT + Meta full, TikTok N stalest.
  cron.schedule("5 0 * * *", async () => {
    console.log("[CRON] Daily analytics sync starting…");
    try {
      const yt = await syncYouTubeStats();
      console.log("[CRON] YouTube:", yt);
    } catch (err) {
      console.error("[CRON] YouTube sync threw", err);
    }
    try {
      const meta = await syncMetaStats();
      console.log("[CRON] Meta:", meta);
    } catch (err) {
      console.error("[CRON] Meta sync threw", err);
    }
    try {
      const tt = await syncTikTokStatsBatch(TIKTOK_DAILY_LIMIT);
      console.log("[CRON] TikTok batch:", tt);
    } catch (err) {
      console.error("[CRON] TikTok sync threw", err);
    }
    console.log("[CRON] Daily sync done.");
  });

  console.log(
    `[CRON] Analytics scheduler initialized (daily @ 00:05, TikTok limit=${TIKTOK_DAILY_LIMIT}/day)`
  );
}
