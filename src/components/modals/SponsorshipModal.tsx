"use client";

import { useState, useTransition, useEffect } from "react";
import { createSponsorship, updateSponsorship, deleteSponsorship } from "@/actions/sponsorships";
import { useToast } from "@/components/ui/Toast";
import type { Sponsorship } from "@prisma/client";

interface SponsorshipModalProps {
  sponsorship: Sponsorship | null;
  onClose: () => void;
  onRefresh: () => void;
}

function toDateInputValue(d?: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function SponsorshipModal({ sponsorship, onClose, onRefresh }: SponsorshipModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isEditing = !!sponsorship;

  const [brandName, setBrandName] = useState(sponsorship?.brandName || "");
  const [contactEmail, setContactEmail] = useState(sponsorship?.contactEmail || "");
  const [budget, setBudget] = useState(sponsorship?.budget?.toString() || "");
  const [status, setStatus] = useState(sponsorship?.status || "Active");
  const [dueDate, setDueDate] = useState(toDateInputValue(sponsorship?.dueDate));
  const [notes, setNotes] = useState(sponsorship?.notes || "");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast("Brand name is required.", "error");
      return;
    }

    startTransition(async () => {
      const data = {
        brandName: brandName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        budget: parseInt(budget, 10) || 0,
        status,
        dueDate: dueDate || null,
        notes: notes.trim() || undefined,
      };

      let result;
      if (isEditing) {
        result = await updateSponsorship(sponsorship.id, data);
      } else {
        result = await createSponsorship(data);
      }

      if (result.success) {
        showToast(`Sponsorship ${isEditing ? "updated" : "created"}.`, "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || "Failed to save.", "error");
      }
    });
  }

  function handleDelete() {
    if (!sponsorship || !confirm("Delete this sponsorship?")) return;
    startTransition(async () => {
      const result = await deleteSponsorship(sponsorship.id);
      if (result.success) {
        showToast("Sponsorship deleted.", "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || "Failed to delete.", "error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div className="absolute inset-0 ui-modal-backdrop" onClick={onClose} />

      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[45rem] ui-modal-shell flex flex-col md:max-h-[90vh]">
        <div className="flex justify-between items-start p-4 md:p-6 border-b border-border-visible shrink-0">
          <h2 className="text-xl font-bold text-text-display uppercase tracking-wider">
            {isEditing ? "EDIT SPONSORSHIP" : "NEW SPONSORSHIP"}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-display font-mono text-xs transition-colors">
            [ X ]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form id="sponsorship-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Brand / Client</label>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  placeholder="e.g. TechCorp"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Contact Email</label>
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  placeholder="e.g. john@techcorp.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Budget ($)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full ui-input p-2 w-full appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full ui-textarea p-3 min-h-[100px] resize-y w-full"
                placeholder="Deliverables, requirements..."
              />
            </div>
          </form>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-3 p-4 md:p-6 border-t border-border-visible shrink-0">
          {isEditing ? (
            <button type="button" onClick={handleDelete} disabled={isPending} className="ui-button-danger px-4 py-2">
              DELETE
            </button>
          ) : (
            <div />
          )}
          <div className="flex flex-col md:flex-row gap-3 md:ml-auto">
            <button type="button" onClick={onClose} className="ui-button-outline px-4 py-2">
              CANCEL
            </button>
            <button type="submit" form="sponsorship-form" disabled={isPending} className="ui-button-primary px-6 py-2 disabled:opacity-50">
              {isPending ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
