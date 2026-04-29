"use client";

import { useState, useTransition, useEffect } from "react";
import { createSponsorship, updateSponsorship, deleteSponsorship } from "@/actions/sponsorships";
import { useToast } from "@/components/ui/Toast";
import type { Sponsorship } from "@prisma/client";
import { useT } from "@/lib/i18n/client";

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
  const t = useT();
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
      showToast(t("sponsorshipModal.brandRequired"), "error");
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
        showToast(t(isEditing ? "sponsorshipModal.updated" : "sponsorshipModal.created"), "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || t("sponsorshipModal.failed"), "error");
      }
    });
  }

  function handleDelete() {
    if (!sponsorship || !confirm(t("sponsorshipModal.confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteSponsorship(sponsorship.id);
      if (result.success) {
        showToast(t("sponsorshipModal.deleted"), "success");
        onRefresh();
        onClose();
      } else {
        showToast(result.error || t("sponsorshipModal.failed"), "error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div className="absolute inset-0 ui-modal-backdrop" onClick={onClose} />

      <div className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[45rem] ui-modal-shell flex flex-col md:max-h-[90vh]">
        <div className="flex justify-between items-start p-4 md:p-6 border-b border-border-visible shrink-0">
          <h2 className="text-xl font-bold text-text-display uppercase tracking-wider">
            {isEditing ? t("sponsorshipModal.edit") : t("sponsorshipModal.new")}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-display font-mono text-xs transition-colors">
            {t("sponsorshipModal.close")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form id="sponsorship-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("sponsorshipModal.brand")}</label>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  placeholder={t("sponsorshipModal.brandPlaceholder")}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("sponsorshipModal.contactEmail")}</label>
                <input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  placeholder={t("sponsorshipModal.contactEmailPlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("sponsorshipModal.budget")}</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full ui-input p-2 w-full"
                  placeholder={t("sponsorshipModal.budgetPlaceholder")}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("sponsorshipModal.status")}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full ui-input p-2 w-full appearance-none"
                >
                  <option value="Active">{t("sponsorshipModal.active")}</option>
                  <option value="Pending">{t("sponsorshipModal.pending")}</option>
                  <option value="Completed">{t("sponsorshipModal.completed")}</option>
                  <option value="Cancelled">{t("sponsorshipModal.cancelled")}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("sponsorshipModal.dueDate")}</label>
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
              <label className="text-[10px] font-mono tracking-widest text-text-secondary uppercase mb-3 block">{t("sponsorshipModal.notes")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full ui-textarea p-3 min-h-[100px] resize-y w-full"
                placeholder={t("sponsorshipModal.notesPlaceholder")}
              />
            </div>
          </form>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-3 p-4 md:p-6 border-t border-border-visible shrink-0">
          {isEditing ? (
            <button type="button" onClick={handleDelete} disabled={isPending} className="ui-button-danger px-4 py-2">
              {t("sponsorshipModal.delete")}
            </button>
          ) : (
            <div />
          )}
          <div className="flex flex-col md:flex-row gap-3 md:ml-auto">
            <button type="button" onClick={onClose} className="ui-button-outline px-4 py-2">
              {t("sponsorshipModal.cancel")}
            </button>
            <button type="submit" form="sponsorship-form" disabled={isPending} className="ui-button-primary px-6 py-2 disabled:opacity-50">
              {isPending ? t("sponsorshipModal.saving") : t("sponsorshipModal.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
