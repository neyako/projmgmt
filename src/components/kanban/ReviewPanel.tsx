"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { submitReview } from "@/actions/projects";
import { useToast } from "@/components/ui/Toast";
import type { ProjectCardData } from "@/types";

interface ReviewPanelProps {
  project: ProjectCardData;
  onProjectUpdate?: (updated: Partial<ProjectCardData> & { id: string }) => void;
  onRequestPublish?: (project: ProjectCardData) => void;
}

export default function ReviewPanel({
  project,
  onProjectUpdate,
  onRequestPublish,
}: ReviewPanelProps) {
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleApprove() {
    // Intercept: publish must go through the checklist modal, not a direct
    // status update. The parent owns the modal + server action.
    if (onRequestPublish) {
      onRequestPublish(project);
      return;
    }
    // No intercept wired → fall back to legacy approve path (kept for safety).
    onProjectUpdate?.({ id: project.id, status: "Published" });
    startTransition(async () => {
      const result = await submitReview(project.id, "approve");
      if (!result.success) {
        onProjectUpdate?.({ id: project.id, status: "Review" });
        showToast(result.error, "error");
        return;
      }
      showToast(`Approved "${project.title}".`, "success");
    });
  }

  function handleReject() {
    const trimmed = feedback.trim();
    if (!trimmed) {
      showToast("Add feedback before rejecting.", "error");
      return;
    }
    onProjectUpdate?.({
      id: project.id,
      status: "Editing",
      reviewFeedback: trimmed,
      reviewLink: null,
      draftVersion: project.draftVersion + 1,
    });
    startTransition(async () => {
      const result = await submitReview(project.id, "reject", trimmed);
      if (!result.success) {
        onProjectUpdate?.({
          id: project.id,
          status: "Review",
          reviewFeedback: project.reviewFeedback ?? null,
          reviewLink: project.reviewLink ?? null,
          draftVersion: project.draftVersion,
        });
        showToast(result.error, "error");
        return;
      }
      showToast(`Rejected "${project.title}" → Editing.`, "success");
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
        className="w-full bg-surface border-b border-border-visible text-xs font-mono text-text-display p-2 min-h-[80px] resize-y focus:outline-none focus:border-text-display transition-colors"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className={cn(
            "flex-1 border border-accent/40 text-accent hover:bg-accent-subtle py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
            isPending && "opacity-50 cursor-wait"
          )}
        >
          [ REJECT ]
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className={cn(
            "flex-1 border border-success/40 text-success hover:bg-success/10 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
            isPending && "opacity-50 cursor-wait"
          )}
        >
          [ APPROVE ]
        </button>
      </div>
      {project.reviewFeedback && (
        <div className="text-[10px] font-mono text-text-secondary italic">
          Prev: {project.reviewFeedback}
        </div>
      )}
    </div>
  );
}
