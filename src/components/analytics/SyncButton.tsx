"use client";

import { useTransition } from "react";
import {
  syncYouTubeStats,
  syncMetaStats,
  syncTikTokStats,
} from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

type Platform = "youtube" | "meta" | "tiktok";

interface SyncConfig {
  labelKey: string;
  syncingKey: string;
  noIdKey: string;
  label: string;
  action: () => Promise<
    | { success: true; data: { updated: number; total: number } }
    | { success: false; error: string }
  >;
}

const CONFIG: Record<Platform, SyncConfig> = {
  youtube: {
    labelKey: "analytics.syncYoutube",
    syncingKey: "analytics.syncingYt",
    noIdKey: "analytics.noYtId",
    label: "YOUTUBE",
    action: syncYouTubeStats,
  },
  meta: {
    labelKey: "analytics.syncFacebook",
    syncingKey: "analytics.syncingFb",
    noIdKey: "analytics.noFbId",
    label: "FACEBOOK",
    action: syncMetaStats,
  },
  tiktok: {
    labelKey: "analytics.syncTiktok",
    syncingKey: "analytics.syncingTt",
    noIdKey: "analytics.noTtId",
    label: "TIKTOK",
    action: syncTikTokStats,
  },
};

export default function SyncButton({ platform }: { platform: Platform }) {
  const { showToast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const cfg = CONFIG[platform];

  function handleSync() {
    startTransition(async () => {
      const result = await cfg.action();
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }
      const { updated, total } = result.data;
      if (total === 0) {
        showToast(t(cfg.noIdKey), "error");
        return;
      }
      showToast(
        t("analytics.syncedToast", {
          updated,
          total,
          label: cfg.label,
          plural: total === 1 ? "" : "s",
        }),
        "success",
      );
    });
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isPending}
      className="ui-button-outline px-3 py-1 disabled:opacity-50 disabled:cursor-wait"
    >
      {isPending ? t(cfg.syncingKey) : t(cfg.labelKey)}
    </button>
  );
}
