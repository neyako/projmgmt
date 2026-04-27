"use client";

import { useTransition } from "react";
import {
  syncYouTubeStats,
  syncMetaStats,
  syncTikTokStats,
} from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";

type Platform = "youtube" | "meta" | "tiktok";

const CONFIG: Record<
  Platform,
  { label: string; syncing: string; action: () => Promise<
    | { success: true; data: { updated: number; total: number } }
    | { success: false; error: string }
  > }
> = {
  youtube: {
    label: "[ SYNC YOUTUBE ]",
    syncing: "[ SYNCING YT... ]",
    action: syncYouTubeStats,
  },
  meta: {
    label: "[ SYNC FACEBOOK ]",
    syncing: "[ SYNCING FB... ]",
    action: syncMetaStats,
  },
  tiktok: {
    label: "[ SYNC TIKTOK ]",
    syncing: "[ SYNCING TT... ]",
    action: syncTikTokStats,
  },
};

export default function SyncButton({ platform }: { platform: Platform }) {
  const { showToast } = useToast();
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
        const label =
          platform === "meta" ? "FACEBOOK" : platform.toUpperCase();
        showToast(`No published projects have a ${label} ID.`, "error");
        return;
      }
      const label =
        platform === "meta" ? "FACEBOOK" : platform.toUpperCase();
      showToast(
        `Synced ${updated}/${total} ${label} video${total === 1 ? "" : "s"}.`,
        "success"
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
      {isPending ? cfg.syncing : cfg.label}
    </button>
  );
}
