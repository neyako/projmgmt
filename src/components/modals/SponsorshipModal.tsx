"use client";

import { useState, useTransition, useEffect } from "react";
import { createSponsorship, updateSponsorship, deleteSponsorship } from "@/actions/sponsorships";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Picker from "@/components/ui/Picker";
import { useToast } from "@/components/ui/Toast";
import { MotionBlock, useTerminalDismiss } from "@/components/motion/TerminalMotion";
import type { Sponsorship } from "@prisma/client";
import {
  SUPPORTED_CURRENCIES,
  convertCurrencyAmount,
  formatCurrencyAmount,
  normalizeCurrency,
  type CurrencyCode,
  type CurrencyRateSnapshot,
} from "@/lib/currency";
import { useLocale, useT } from "@/lib/i18n/client";

interface SponsorshipModalProps {
  sponsorship: Sponsorship | null;
  preferredCurrency: CurrencyCode;
  rateSnapshot: CurrencyRateSnapshot;
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

export default function SponsorshipModal({
  sponsorship,
  preferredCurrency,
  rateSnapshot,
  onClose,
  onRefresh,
}: SponsorshipModalProps) {
  const { showToast } = useToast();
  const t = useT();
  const locale = useLocale();
  const moneyLocale = locale === "vi" ? "vi-VN" : "en-US";
  const [isPending, startTransition] = useTransition();
  const {
    ref: panelRef,
    isDismissing,
    requestDismiss,
    forceDismiss,
  } = useTerminalDismiss<HTMLDivElement>(onClose, { disabled: isPending });

  const isEditing = !!sponsorship;

  const [brandName, setBrandName] = useState(sponsorship?.brandName || "");
  const [contactEmail, setContactEmail] = useState(sponsorship?.contactEmail || "");
  const [budget, setBudget] = useState(sponsorship?.budget?.toString() || "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    normalizeCurrency(sponsorship?.currency)
  );
  const [status, setStatus] = useState(sponsorship?.status || "Active");
  const [dueDate, setDueDate] = useState(toDateInputValue(sponsorship?.dueDate));
  const [notes, setNotes] = useState(sponsorship?.notes || "");

  const parsedBudget = parseInt(budget, 10) || 0;
  const convertedPreview = convertCurrencyAmount(
    parsedBudget,
    currency,
    preferredCurrency,
    rateSnapshot.rates
  );
  const shouldShowPreview = parsedBudget > 0 && currency !== preferredCurrency;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") requestDismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestDismiss]);

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
        budget: parsedBudget,
        currency,
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
        forceDismiss();
      } else {
        showToast(result.error || t("projectModal.updateFailed"), "error");
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
        forceDismiss();
      } else {
        showToast(result.error || t("projectModal.updateFailed"), "error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center overflow-hidden md:p-4 lg:p-6">
      <div className="absolute inset-0 ui-modal-backdrop" onClick={requestDismiss} />

      <MotionBlock
        ref={panelRef}
        preset="panel"
        aria-hidden={isDismissing}
        data-motion-state={isDismissing ? "exiting" : "entered"}
        className="relative w-screen h-[100dvh] max-h-[100dvh] md:w-full md:h-auto md:max-w-[45rem] ui-panel flex flex-col md:max-h-[90vh]"
      >
        <div className="flex justify-between items-start p-4 md:p-6 border-b border-border-visible shrink-0">
          <h2 className="text-xl font-bold text-text-display uppercase tracking-wider">
            {isEditing ? t("sponsorshipModal.edit") : t("sponsorshipModal.new")}
          </h2>
          <button onClick={requestDismiss} className="text-text-secondary hover:bg-text-display hover:text-text-inverse font-mono text-xs px-1">
            {t("sponsorshipModal.close")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <form id="sponsorship-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t("sponsorshipModal.brand")}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                variant="panel"
                labelClassName="text-[10px]"
                wrapperClassName="gap-3"
                placeholder={t("sponsorshipModal.brandPlaceholder")}
              />
              <Input
                label={t("sponsorshipModal.contactEmail")}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                variant="panel"
                labelClassName="text-[10px]"
                wrapperClassName="gap-3"
                placeholder={t("sponsorshipModal.contactEmailPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input
                type="number"
                min="0"
                step="1"
                label={t("sponsorshipModal.budget")}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                variant="panel"
                labelClassName="text-[10px]"
                wrapperClassName="gap-3"
                placeholder={t("sponsorshipModal.budgetPlaceholder")}
              />
              <Picker
                label={t("sponsorshipModal.currency")}
                value={currency}
                onChange={(e) => setCurrency(normalizeCurrency(e.target.value))}
                variant="panel"
                labelClassName="text-[10px]"
                wrapperClassName="gap-3"
              >
                {SUPPORTED_CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} / {item.label}
                  </option>
                ))}
              </Picker>
              <Picker
                label={t("sponsorshipModal.status")}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                variant="panel"
                labelClassName="text-[10px]"
                wrapperClassName="gap-3"
              >
                <option value="Active">{t("sponsorshipModal.active")}</option>
                <option value="Pending">{t("sponsorshipModal.pending")}</option>
                <option value="Completed">{t("sponsorshipModal.completed")}</option>
                <option value="Cancelled">{t("sponsorshipModal.cancelled")}</option>
              </Picker>
              <Input
                type="date"
                label={t("sponsorshipModal.dueDate")}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                variant="panel"
                labelClassName="text-[10px]"
                wrapperClassName="gap-3"
              />
            </div>

            {shouldShowPreview && (
              <div className="border border-border-visible bg-input-surface p-3 font-mono text-xs">
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">
                  {t("sponsorshipModal.preferredPreview")}
                </div>
                <div className="mt-2 text-success">
                  {convertedPreview !== null
                    ? formatCurrencyAmount(convertedPreview, preferredCurrency, moneyLocale)
                    : t("sponsorships.rateUnavailable")}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-text-secondary">
                  {formatCurrencyAmount(parsedBudget, currency, moneyLocale)} {"->"} {preferredCurrency}
                </div>
              </div>
            )}

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
            <Button type="button" onClick={handleDelete} disabled={isPending} variant="danger" className="px-4 py-2">
              {t("sponsorshipModal.delete")}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex flex-col md:flex-row gap-3 md:ml-auto">
            <Button type="button" onClick={requestDismiss} variant="outline" className="px-4 py-2">
              {t("sponsorshipModal.cancel")}
            </Button>
            <Button type="submit" form="sponsorship-form" disabled={isPending} className="px-6 py-2">
              {isPending ? t("sponsorshipModal.saving") : t("sponsorshipModal.save")}
            </Button>
          </div>
        </div>
      </MotionBlock>
    </div>
  );
}
