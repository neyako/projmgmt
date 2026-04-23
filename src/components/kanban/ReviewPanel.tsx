"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { submitReview } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";

interface ReviewPanelProps {
  project: ProjectCardData;
  onProjectUpdate?: (updated: Partial<ProjectCardData> & { id: string }) => void;
}

export default function ReviewPanel({ project, onProjectUpdate }: ReviewPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleAction(action: "approve" | "reject") {
    const trimmed = feedback.trim();
    if (action === "reject" && !trimmed) {
      showToast("Add feedback before rejecting.", "error");
      return;
    }
    const newStatus = action === "approve" ? "Published" : "Editing";
    // Optimistic parent update
    onProjectUpdate?.({
      id: project.id,
      status: newStatus,
      ...(action === "reject" && { reviewFeedback: trimmed }),
    });
    startTransition(async () => {
      const result = await submitReview(project.id, action, trimmed || undefined);
      if (!result.success) {
        // Revert
        onProjectUpdate?.({
          id: project.id,
          status: "Review",
          ...(action === "reject" && { reviewFeedback: project.reviewFeedback ?? null }),
        });
        showToast(result.error, "error");
        return;
      }
      showToast(
        action === "approve"
          ? `Approved "${project.title}".`
          : `Rejected "${project.title}" → Editing.`,
        "success"
      );
    });
  }

  return (
    <div
      className="mt-sm flex flex-col gap-2"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Add feedback..."
        className="w-full bg-[#0a0a0a] border-b border-white/10 text-xs font-mono text-white p-2 min-h-[80px] resize-y focus:outline-none focus:border-white/50 transition-colors"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={isPending}
          className={cn(
            "flex-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
            isPending && "opacity-50 cursor-wait"
          )}
        >
          [ REJECT ]
        </button>
        <button
          type="button"
          onClick={() => handleAction("approve")}
          disabled={isPending}
          className={cn(
            "flex-1 border border-green-500/40 text-green-400 hover:bg-green-500/10 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
            isPending && "opacity-50 cursor-wait"
          )}
        >
          [ APPROVE ]
        </button>
      </div>
      {project.reviewFeedback && (
        <div className="text-[10px] font-mono text-gray-500 italic">
          Prev: {project.reviewFeedback}
        </div>
      )}
    </div>
  );
}
