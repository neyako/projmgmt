"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { format, getDictionary, lookup, type Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./locales";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: Locale;
  children: ReactNode;
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, dict: getDictionary(locale) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export type T = (key: string, vars?: Record<string, string | number>) => string;

export function useT(): T {
  const ctx = useContext(I18nContext);
  const dict = ctx?.dict ?? getDictionary(DEFAULT_LOCALE);
  return useCallback(
    (key, vars) => format(lookup(dict, key), vars),
    [dict],
  );
}

export function useLocale(): Locale {
  return useContext(I18nContext)?.locale ?? DEFAULT_LOCALE;
}
