"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPreferredCurrency } from "@/actions/settings";
import {
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import Picker from "@/components/ui/Picker";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

export default function CurrencyPreferenceForm({
  currentCurrency,
}: {
  currentCurrency: CurrencyCode;
}) {
  const t = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<CurrencyCode>(currentCurrency);

  function handleChange(value: string) {
    const nextCurrency = normalizeCurrency(value);
    setSelected(nextCurrency);

    if (nextCurrency === currentCurrency || pending) return;

    startTransition(async () => {
      const result = await setPreferredCurrency(nextCurrency);
      if (result.ok) {
        showToast(t("settings.currencySaved"), "success");
        router.refresh();
      } else {
        setSelected(currentCurrency);
        showToast(result.error || t("projectModal.updateFailed"), "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
          {t("settings.preferredCurrency")}
        </label>
        <p className="text-xs font-mono text-text-secondary">
          {t("settings.currencyDescription")}
        </p>
      </div>
      <Picker
        value={selected}
        onChange={(event) => handleChange(event.target.value)}
        disabled={pending}
        variant="panel"
        className="px-3 py-2"
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} / {currency.label}
          </option>
        ))}
      </Picker>
    </div>
  );
}
