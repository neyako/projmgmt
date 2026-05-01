"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

export type PlatformKey = "youtube" | "tiktok" | "facebook";

const META: Record<PlatformKey, { label: string; color: string; noIdKey: string; copiedKey: string; copyKey: string; noIdTitleKey: string }> = {
  youtube: {
    label: "YT",
    color: "#FF0033",
    noIdKey: "analytics.platform.noYt",
    copiedKey: "analytics.platform.copiedYt",
    copyKey: "analytics.platform.copyYt",
    noIdTitleKey: "analytics.platform.ytNoId",
  },
  tiktok: {
    label: "TT",
    color: "#FF3B5C",
    noIdKey: "analytics.platform.noTt",
    copiedKey: "analytics.platform.copiedTt",
    copyKey: "analytics.platform.copyTt",
    noIdTitleKey: "analytics.platform.ttNoId",
  },
  facebook: {
    label: "FB",
    color: "#1877F2",
    noIdKey: "analytics.platform.noFb",
    copiedKey: "analytics.platform.copiedFb",
    copyKey: "analytics.platform.copyFb",
    noIdTitleKey: "analytics.platform.fbNoId",
  },
};

function buildUrl(key: PlatformKey, id: string, handle: string) {
  if (key === "youtube") return `https://www.youtube.com/watch?v=${id}`;
  if (key === "tiktok") return `https://www.tiktok.com/@${handle}/video/${id}`;
  return `https://www.facebook.com/reel/${id}`;
}

export default function PlatformBadge({
  platform,
  id,
  tiktokHandle,
}: {
  platform: PlatformKey;
  id?: string | null;
  tiktokHandle: string;
}) {
  const { showToast } = useToast();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const meta = META[platform];
  const hasId = Boolean(id);

  async function handleClick() {
    if (!hasId) {
      showToast(t(meta.noIdKey), "error");
      return;
    }
    const url = buildUrl(platform, id!, tiktokHandle);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast(t(meta.copiedKey), "success");
      setTimeout(() => setCopied(false), 1200);
      return;
    } catch {
      // fall through to legacy fallback
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      showToast(t(meta.copiedKey), "success");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      showToast(`${t("analytics.platform.copyBlocked")} ${url}`, "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={hasId ? t(meta.copyKey) : t(meta.noIdTitleKey)}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest border rounded shrink-0 ${
        hasId
          ? "border-border-visible text-text-display hover:border-text-display cursor-pointer"
          : "border-border text-text-disabled cursor-not-allowed"
      }`}
      style={hasId ? { borderLeftWidth: 2, borderLeftColor: meta.color } : undefined}
    >
      <span>{meta.label}</span>
      {hasId && <span className="opacity-70">{copied ? "✓" : "⎘"}</span>}
    </button>
  );
}
