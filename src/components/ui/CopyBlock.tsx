"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CopyBlockProps {
  label: string;
  /** Text actually copied to clipboard. */
  copyValue: string;
  /** Optional custom rendered body. Falls back to `copyValue`. */
  children?: React.ReactNode;
  className?: string;
}

export default function CopyBlock({
  label,
  copyValue,
  children,
  className,
}: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    // Optimistic UI feedback — copy is fire-and-forget.
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const text = copyValue ?? "";
    if (!navigator?.clipboard?.writeText) {
      // Fallback for constrained contexts (iframes without permissions).
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* no-op */
      }
      return;
    }
    navigator.clipboard.writeText(text).catch(() => {
      /* user feedback already shown */
    });
  }

  return (
    <div
      className={cn(
        "bg-[#0a0a0a] border border-white/10 p-4 font-mono text-sm text-gray-300 relative",
        className
      )}
    >
      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
        {label}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 text-[10px] font-mono uppercase tracking-widest transition-colors",
          copied ? "text-success" : "text-gray-500 hover:text-white"
        )}
      >
        {copied ? "[ COPIED! ]" : "[ COPY ]"}
      </button>
      <div className="whitespace-pre-wrap break-words">
        {children ?? copyValue}
      </div>
    </div>
  );
}
