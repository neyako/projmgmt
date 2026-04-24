"use client";

import { useState, useEffect, useMemo } from "react";
import type { Sponsorship } from "@prisma/client";
import SponsorshipModal from "@/components/modals/SponsorshipModal";
import { useRouter } from "next/navigation";

type TabKey = "All" | "Active" | "Pending" | "Archived";

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

export default function SponsorshipsClient({
  initialSponsorships,
}: {
  initialSponsorships: Sponsorship[];
}) {
  const router = useRouter();
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
            Pipeline
          </h1>
          <div className="flex justify-between items-end border-b border-border-visible pb-2">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-2xl font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? "text-text-display"
                      : "text-text-disabled hover:text-text-secondary"
                  }`}
                >
                  [ {tab.toUpperCase()} ]
                </button>
              ))}
            </div>
            <button
              onClick={handleOpenNew}
              className="ui-button-outline px-6 py-2 flex items-center shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] mr-2">add</span>
              NEW SPONSORSHIP
            </button>
          </div>
          <div className="ui-page-meta mt-2">
            {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="ui-panel p-12 text-center">
            <div className="ui-page-kicker">
              No {activeTab} Sponsorships Found
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="ui-table-head p-4">
                  Brand
                </th>
                <th className="ui-table-head p-4">
                  Status
                </th>
                <th className="ui-table-head p-4">
                  Contact
                </th>
                <th className="ui-table-head p-4">
                  Due Date
                </th>
                <th className="ui-table-head p-4 text-right">
                  Value
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
                        {s.status}
                      </span>
                    </span>
                  </td>
                  <td className="p-4 ui-table-cell-muted">
                    {s.contactEmail || "—"}
                  </td>
                  <td className="p-4 ui-table-cell-muted">
                    {formatDate(s.dueDate)}
                  </td>
                  <td className="p-4 text-sm font-mono text-success text-right">
                    ${s.budget.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
