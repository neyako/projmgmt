import Shell from "@/components/layout/Shell";

// Sponsorship demo data
const deals = [
  {
    id: "1",
    title: "TechCorp Podcast Integration",
    description: "Episode 142 - Mid-roll Read",
    client: "TechCorp Inc.",
    value: 12500,
    status: "PAID" as const,
  },
  {
    id: "2",
    title: "DesignSys UI Kit Sponsorship",
    description: "Newsletter Issue #89 - Feature Slot",
    client: "DesignSys LLC",
    value: 4200,
    status: "PENDING" as const,
  },
  {
    id: "3",
    title: "AeroFlow Workstation Review",
    description: "YouTube Video - Dedicated Review",
    client: "AeroFlow Systems",
    value: 18000,
    status: "OVERDUE" as const,
  },
  {
    id: "4",
    title: "CloudData Annual Summit",
    description: "Event Speaker & Booth Sponsor",
    client: "CloudData Partners",
    value: 35000,
    status: "PENDING" as const,
  },
  {
    id: "5",
    title: "Lumina Desk Lamp Placement",
    description: "Instagram Reel Series (3x)",
    client: "Lumina Goods",
    value: 8500,
    status: "PAID" as const,
  },
];

const statusColor = {
  PAID: "text-success",
  PENDING: "text-warning",
  OVERDUE: "text-error",
};

const dotColor = {
  PAID: "bg-success",
  PENDING: "bg-warning",
  OVERDUE: "bg-error",
};

export default function SponsorshipsPage() {
  return (
    <Shell>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2xl md:p-3xl max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-lg border-b border-border-visible pb-md">
            <div>
              <h2 className="text-style-display-md text-text-display mb-sm">
                Sponsorships
              </h2>
              <p className="text-style-body-sm text-text-secondary w-2/3">
                Manage active deal pipelines, track client commitments, and
                monitor payment statuses across all active projects.
              </p>
            </div>
            <nav className="flex gap-lg text-style-label tracking-widest">
              <a
                href="#"
                className="text-text-display border-b-2 border-text-display pb-xs"
              >
                ALL DEALS
              </a>
              <a
                href="#"
                className="text-text-secondary hover:text-text-display transition-colors pb-xs"
              >
                PENDING
              </a>
              <a
                href="#"
                className="text-text-secondary hover:text-text-display transition-colors pb-xs"
              >
                ARCHIVED
              </a>
            </nav>
          </header>

          {/* Data Table */}
          <div className="w-full bg-surface border border-border-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-visible bg-surface-raised/30">
                  <th className="py-md px-lg text-style-label text-text-secondary tracking-widest w-2/5">
                    ACTIVE DEALS
                  </th>
                  <th className="py-md px-lg text-style-label text-text-secondary tracking-widest w-1/5">
                    CLIENT
                  </th>
                  <th className="py-md px-lg text-style-label text-text-secondary tracking-widest w-1/5 text-right">
                    VALUE
                  </th>
                  <th className="py-md px-lg text-style-label text-text-secondary tracking-widest w-1/5 text-right">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal, i) => (
                  <tr
                    key={deal.id}
                    className={`${i < deals.length - 1 ? "border-b border-border-visible" : ""} hover:bg-surface-raised transition-colors group`}
                  >
                    <td className="py-lg px-lg">
                      <div className="text-style-subheading text-text-display mb-xs">
                        {deal.title}
                      </div>
                      <div className="text-style-caption text-text-secondary uppercase">
                        {deal.description}
                      </div>
                    </td>
                    <td className="py-lg px-lg text-style-body-sm text-text-primary">
                      {deal.client}
                    </td>
                    <td className="py-lg px-lg text-style-caption text-text-primary text-right">
                      ${deal.value.toLocaleString()}.00
                    </td>
                    <td className="py-lg px-lg text-right">
                      <span
                        className={`text-style-caption ${statusColor[deal.status]} flex items-center justify-end gap-sm`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${dotColor[deal.status]}`}
                        />
                        {deal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-lg flex justify-between items-center text-text-secondary text-style-caption uppercase">
            <div>SHOWING 1-5 OF 24 DEALS</div>
            <div className="flex gap-sm">
              <button className="hover:text-text-display transition-colors">
                PREV
              </button>
              <span className="text-text-display">1</span>
              <button className="hover:text-text-display transition-colors">
                2
              </button>
              <button className="hover:text-text-display transition-colors">
                3
              </button>
              <span className="px-xs">...</span>
              <button className="hover:text-text-display transition-colors">
                NEXT
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
