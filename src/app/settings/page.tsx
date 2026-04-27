import { getServerSession } from "next-auth";
import Shell from "@/components/layout/Shell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvatarUploadForm from "./AvatarUploadForm";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, avatarUrl: true },
      })
    : null;

  return (
    <Shell>
      <div className="flex-1 w-full h-full overflow-y-auto p-lg">
        <div className="w-full max-w-[48rem] mx-auto flex flex-col gap-12">
          <header>
            <h1 className="text-2xl md:text-3xl font-bold text-text-display uppercase tracking-widest mb-4">
              System Settings
            </h1>
            <p className="text-sm font-mono text-text-secondary max-w-[28rem]">
              Manage your local workspace, rendering preferences, and user account parameters.
            </p>
          </header>

          <section className="border-t border-border-visible pt-8">
            <h3 className="text-sm font-bold text-text-display uppercase tracking-widest mb-6">PROFILE</h3>
            <div className="flex flex-col gap-8 w-full">
              <AvatarUploadForm avatarUrl={user?.avatarUrl ?? null} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    DISPLAY NAME
                  </label>
                  <input
                    type="text"
                    value={user?.name ?? ""}
                    readOnly
                    className="bg-transparent border-0 border-b border-border-visible focus:outline-none px-0 py-2 text-xs font-mono text-text-display w-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={user?.email ?? ""}
                    readOnly
                    className="bg-transparent border-0 border-b border-border-visible focus:outline-none px-0 py-2 text-xs font-mono text-text-display w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-border-visible pt-8 w-full">
            <h3 className="text-sm font-bold text-text-display uppercase tracking-widest mb-6">SECURITY</h3>
            <ChangePasswordForm />
          </section>

          <div className="flex justify-end pt-6 pb-4 w-full">
            <button
              type="submit"
              form="change-password-form"
              className="bg-text-display text-text-inverse text-[10px] font-mono uppercase tracking-widest px-6 py-2 hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
