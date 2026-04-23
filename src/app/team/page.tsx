import Shell from "@/components/layout/Shell";
import { prisma } from "@/lib/prisma";

export default async function TeamPage() {
  const users = await prisma.user.findMany({
    include: {
      projectsCreated: { where: { status: { not: "Published" } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <Shell>
      <div className="flex-1 p-xl lg:p-3xl max-w-[1600px] w-full mx-auto overflow-y-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-xl mb-3xl">
          <div>
            <h2 className="text-style-display-md text-text-display mb-sm">
              ROSTER
            </h2>
            <p className="text-style-label text-text-secondary tracking-widest">
              {users.length} ACTIVE PERSONNEL | SYSTEM STATUS NORMAL
            </p>
          </div>
          <button className="bg-transparent border border-border-visible text-text-display text-style-label px-6 py-2 h-[44px] flex items-center justify-center uppercase hover:bg-surface-raised transition-colors rounded-full whitespace-nowrap">
            <span className="material-symbols-outlined mr-2 text-[16px]">
              add
            </span>
            ADD MEMBER
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          {users.map((user) => {
            const activeCount = user.projectsCreated.length;
            const isOvercapacity = activeCount > 6;
            return (
              <div
                key={user.id}
                className={`${
                  isOvercapacity
                    ? "bg-surface-raised border-outline-variant"
                    : "bg-surface border-border-visible"
                } border p-lg flex flex-col hover:border-outline-variant transition-colors group cursor-pointer relative overflow-hidden`}
              >
                {isOvercapacity && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-accent-subtle blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                )}

                <div className="flex justify-between items-start mb-xl relative z-10">
                  <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-secondary overflow-hidden">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className={`w-2 h-2 rounded-full ${
                          dot < Math.min(activeCount, 3)
                            ? isOvercapacity
                              ? "bg-accent"
                              : "bg-success"
                            : "bg-surface-raised border border-border-visible"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-md relative z-10">
                  <h3 className="text-style-heading text-text-primary mb-xs">
                    {user.name.toUpperCase()}
                  </h3>
                  <p className="text-style-label text-text-secondary">
                    {user.role.replace("_", " ")}
                  </p>
                </div>

                <div className="mt-auto pt-md border-t border-border-visible flex justify-between items-end relative z-10">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-style-label text-[10px] ${isOvercapacity ? "text-accent" : "text-text-disabled"}`}
                    >
                      {isOvercapacity ? "OVERCAPACITY" : "ACTIVE PROJECTS"}
                    </span>
                    <span className="text-style-caption text-text-primary">
                      {String(activeCount).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
                    arrow_forward
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
