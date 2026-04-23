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
      return "bg-emerald-500";
    case "Pending":
      return "bg-yellow-500";
    case "Completed":
      return "bg-blue-500";
    case "Cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
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
          <h1 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
            Pipeline
          </h1>
          <div className="flex justify-between items-end border-b border-white/10 pb-2">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-2xl font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? "text-white"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  [ {tab.toUpperCase()} ]
                </button>
              ))}
            </div>
            <button
              onClick={handleOpenNew}
              className="bg-transparent border border-white/10 text-white text-[10px] font-mono px-6 py-2 uppercase hover:bg-white/5 transition-colors tracking-widest flex items-center shrink-0"
            >
              <span className="material-symbols-outlined text-[14px] mr-2">add</span>
              NEW SPONSORSHIP
            </button>
          </div>
          <div className="text-xs font-mono text-gray-500 mt-2">
            {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-white/10 p-12 text-center">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              No {activeTab} Sponsorships Found
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  Brand
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  Status
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  Contact
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4">
                  Due Date
                </th>
                <th className="border-b border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest p-4 text-right">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => handleOpenEdit(s.id)}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-sm font-mono text-gray-300 font-bold">
                    {s.brandName}
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-300">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusDotColor(s.status)}`}
                      />
                      <span className="uppercase tracking-widest text-[10px]">
                        {s.status}
                      </span>
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-500">
                    {s.contactEmail || "—"}
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-400">
                    {formatDate(s.dueDate)}
                  </td>
                  <td className="p-4 text-sm font-mono text-emerald-400 text-right">
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
