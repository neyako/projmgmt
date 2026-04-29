import en from "@/locales/en.json";
import vi from "@/locales/vi.json";
import type { Locale } from "./locales";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  vi: vi as unknown as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export type DotPath<T, P extends string = ""> = T extends string
  ? P
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: DotPath<T[K], P extends "" ? K : `${P}.${K}`>;
      }[keyof T & string]
    : never;

export type TKey = DotPath<Dictionary>;

export function lookup(dict: Dictionary, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}

export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
