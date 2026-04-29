"use client";

import { useState, useEffect, useMemo } from "react";
import type { Sponsorship } from "@prisma/client";
import SponsorshipModal from "@/components/modals/SponsorshipModal";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

type TabKey = "All" | "Active" | "Pending" | "Archived";
type SponsorshipListItem = Sponsorship & {
  _count?: {
    projects: number;
  };
};

export type SponsorshipSummary = {
  pendingCount: number;
  pendingTotal: number;
  currentMonthTotal: number;
  currentMonthLabel: string;
  monthlyTotals: { key: string; label: string; total: number }[];
};

const TABS: TabKey[] = ["All", "Active", "Pending", "Archived"];

function statusDotColor(status: string): string {
  switch (status) {
    case "Active":
      return "bg-success";
    case "Pending":
      return "bg-warning";
    case "Completed":
      return "bg-interactive";
    case "Cancelled":
      return "bg-accent";
    default:
      return "bg-text-disabled";
  }
}

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
    .toUpperCase();
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export default function SponsorshipsClient({
  initialSponsorships,
  summary,
}: {
  initialSponsorships: SponsorshipListItem[];
  summary: SponsorshipSummary;
}) {
  const router = useRouter();
  const t = useT();
  const [sponsorships, setSponsorships] = useState(initialSponsorships);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("All");

  useEffect(() => {
    setSponsorships(initialSponsorships);
  }, [initialSponsorships]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "Active":
        return sponsorships.filter((s) => s.status === "Active");
      case "Pending":
        return sponsorships.filter((s) => s.status === "Pending");
      case "Archived":
        return sponsorships.filter(
          (s) => s.status === "Completed" || s.status === "Cancelled"
        );
      case "All":
      default:
        return sponsorships;
    }
  }, [sponsorships, activeTab]);

  const selectedSponsorship = selectedId
    ? sponsorships.find((s) => s.id === selectedId) ?? null
    : null;

  function handleOpenNew() {
    setSelectedId(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(id: string) {
    setSelectedId(id);
    setIsModalOpen(true);
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <>
      <div className="h-full w-full overflow-auto p-lg">
        <div className="mb-6">
          <h1 className="ui-page-kicker mb-1">
            {t("sponsorships.title")}
          </h1>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-border-visible pb-2">
            <div className="flex gap-3 md:gap-6 overflow-x-auto pb-1 md:pb-0">
              {TABS.map((tab) => {
                const tabKeyMap: Record<TabKey, string> = {
                  All: "sponsorships.all",
                  Active: "sponsorships.activeFilter",
                  Pending: "sponsorships.pendingFilter",
                  Archived: "sponsorships.archivedFilter",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xl md:text-2xl font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "text-text-display"
                        : "text-text-disabled hover:text-text-secondary"
                    }`}
                  >
                    {t(tabKeyMap[tab])}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleOpenNew}
              className="ui-button-outline px-6 py-2 flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] mr-2">add</span>
              {t("sponsorships.newSponsorship")}
            </button>
          </div>
          <div className="ui-page-meta mt-2">
            {filtered.length} {filtered.length === 1 ? t("sponsorships.deal") : t("sponsorships.deals")}
          </div>
        </div>

        <section className="mb-6">
          <div className="ui-page-kicker mb-3">{t("sponsorships.atAGlance")}</div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-3">
            <div className="ui-panel p-4 min-w-0">
              <div className="flex items-center justify-between gap-3 border-b border-border-visible pb-3">
                <div className="text-[10px] font-mono tracking-widest uppercase text-text-secondary">
                  {t("sponsorships.pendingPayment")}
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-warning whitespace-nowrap">
                  {summary.pendingCount} {summary.pendingCount === 1 ? t("sponsorships.dealSingular") : t("sponsorships.dealPlural")}
                </div>
              </div>
              <div className="mt-4 text-style-display-md text-text-display break-words">
                {formatMoney(summary.pendingTotal)}
              </div>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-text-secondary">
                {t("sponsorships.allTimePending")}
              </div>
            </div>

            <div className="ui-panel p-4 min-w-0">
              <div className="flex items-center justify-between gap-3 border-b border-border-visible pb-3">
                <div className="text-[10px] font-mono tracking-widest uppercase text-text-secondary">
                  {t("sponsorships.closedThisMonth")}
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-success whitespace-nowrap">
                  {summary.currentMonthLabel}
                </div>
              </div>
              <div className="mt-4 text-style-display-md text-text-display break-words">
                {formatMoney(summary.currentMonthTotal)}
              </div>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-text-secondary">
                {t("sponsorships.nonCancelled")}
              </div>
            </div>

            <div className="ui-panel p-4 min-w-0">
              <div className="flex items-center justify-between gap-3 border-b border-border-visible pb-3">
                <div className="text-[10px] font-mono tracking-widest uppercase text-text-secondary">
                  {t("sponsorships.monthlyRevenue")}
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-text-secondary whitespace-nowrap">
                  {summary.monthlyTotals[0]?.key.slice(0, 4)}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {summary.monthlyTotals.map((month) => (
                  <div
                    key={month.key}
                    className="border border-border-visible bg-input-surface p-3 min-w-0"
                  >
                    <div className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">
                      {month.label}
                    </div>
                    <div className="mt-2 text-xs font-mono text-text-display break-words">
                      {formatMoney(month.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="ui-panel p-12 text-center">
            <div className="ui-page-kicker">
              {t("sponsorships.noFoundFor", { tab: t(`sponsorships.tab${activeTab}`) })}
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleOpenEdit(s.id)}
                  className="ui-panel p-4 text-left flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold font-mono text-text-display uppercase tracking-wider break-words">
                        {s.brandName}
                      </div>
                      <div className="ui-page-meta mt-2 break-all">
                        {s.contactEmail || "—"}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusDotColor(s.status)}`}
                      />
                      <span className="uppercase tracking-widest text-[10px] text-text-secondary">
                        {t(`sponsorshipModal.${s.status.toLowerCase()}`)}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-border-visible pt-3">
                    <div>
                      <div className="ui-page-kicker">{t("sponsorships.due")}</div>
                      <div className="text-xs font-mono text-text-display">
                        {formatDate(s.dueDate)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="ui-page-kicker">{t("sponsorships.projects")}</div>
                      <div className="text-xs font-mono text-text-display">
                        {s._count?.projects ?? 0}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="ui-page-kicker">{t("sponsorships.value")}</div>
                      <div className="text-xs font-mono text-success">
                        ${s.budget.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="ui-table-head p-4">
                    {t("sponsorships.brand")}
                  </th>
                  <th className="ui-table-head p-4">
                    {t("sponsorships.statusCol")}
                  </th>
                  <th className="ui-table-head p-4">
                    {t("sponsorships.contact")}
                  </th>
                  <th className="ui-table-head p-4">
                    {t("sponsorships.dueDate")}
                  </th>
                  <th className="ui-table-head p-4 text-right">
                    {t("sponsorships.projects")}
                  </th>
                  <th className="ui-table-head p-4 text-right">
                    {t("sponsorships.value")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleOpenEdit(s.id)}
                    className="ui-table-row cursor-pointer"
                  >
                    <td className="p-4 ui-table-cell font-bold">
                      {s.brandName}
                    </td>
                    <td className="p-4 ui-table-cell">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusDotColor(s.status)}`}
                        />
                        <span className="uppercase tracking-widest text-[10px]">
                          {t(`sponsorshipModal.${s.status.toLowerCase()}`)}
                        </span>
                      </span>
                    </td>
                    <td className="p-4 ui-table-cell-muted">
                      {s.contactEmail || "—"}
                    </td>
                    <td className="p-4 ui-table-cell-muted">
                      {formatDate(s.dueDate)}
                    </td>
                    <td className="p-4 text-sm font-mono text-text-display text-right">
                      {s._count?.projects ?? 0}
                    </td>
                    <td className="p-4 text-sm font-mono text-success text-right">
                      ${s.budget.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {isModalOpen && (
        <SponsorshipModal
          sponsorship={selectedSponsorship}
          onClose={() => setIsModalOpen(false)}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
}
