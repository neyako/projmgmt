import { getServerSession } from "next-auth";
import Shell from "@/components/layout/Shell";
import { authOptions } from "@/lib/auth";
import { getApplicationSettings } from "@/lib/appSettings";
import { normalizeCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import ApplicationSettingsForm from "./ApplicationSettingsForm";
import AvatarUploadForm from "./AvatarUploadForm";
import ChangePasswordForm from "./ChangePasswordForm";
import LanguageForm from "./LanguageForm";
import CurrencyPreferenceForm from "./CurrencyPreferenceForm";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id
      ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, avatarUrl: true, preferredCurrency: true },
      })
    : null;
  const t = await getT();
  const isAdmin = session?.user?.role === "ADMIN";
  const appSettings = isAdmin ? await getApplicationSettings() : null;

  return (
    <Shell>
      <div className="flex-1 w-full h-full overflow-y-auto p-lg">
        <div className="w-full max-w-[48rem] mx-auto flex flex-col gap-12">
          <header>
            <h1 className="text-2xl md:text-3xl font-bold text-text-display uppercase tracking-widest mb-4">
              {t("settings.title")}
            </h1>
            <p className="text-sm font-mono text-text-secondary max-w-[28rem]">
              {t("settings.subtitle")}
            </p>
          </header>

          <section className="border-t border-border-visible pt-8">
            <h3 className="text-sm font-bold text-text-display uppercase tracking-widest mb-6">{t("settings.profile")}</h3>
            <div className="flex flex-col gap-8 w-full">
              <AvatarUploadForm avatarUrl={user?.avatarUrl ?? null} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <Input
                  type="text"
                  label={t("settings.displayName")}
                  value={user?.name ?? ""}
                  readOnly
                  size="sm"
                  wrapperClassName="w-full"
                />
                <Input
                  type="email"
                  label={t("settings.emailAddress")}
                  value={user?.email ?? ""}
                  readOnly
                  size="sm"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-border-visible pt-8 w-full">
            <h3 className="text-sm font-bold text-text-display uppercase tracking-widest mb-6">{t("settings.preferences")}</h3>
            <div className="flex flex-col gap-8">
              <LanguageForm />
              <CurrencyPreferenceForm
                currentCurrency={normalizeCurrency(user?.preferredCurrency)}
              />
            </div>
          </section>

          {isAdmin && appSettings && (
            <section className="border-t border-border-visible pt-8 w-full">
              <h3 className="text-sm font-bold text-text-display uppercase tracking-widest mb-6">{t("settings.application")}</h3>
              <ApplicationSettingsForm initialSettings={appSettings} />
            </section>
          )}

          <section className="border-t border-border-visible pt-8 w-full">
            <h3 className="text-sm font-bold text-text-display uppercase tracking-widest mb-6">{t("settings.security")}</h3>
            <ChangePasswordForm />
          </section>

          <div className="flex justify-end pt-6 pb-4 w-full">
            <Button
              type="submit"
              form="change-password-form"
              className="px-6 py-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              {t("settings.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
