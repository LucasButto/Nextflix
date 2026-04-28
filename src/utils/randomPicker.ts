import {
  COUNTRY_PRIORITY,
  POPULAR_PROVIDER_IDS,
} from "@/constants/randomPicker";
import type { PickerProvider, RandomPickerItem } from "@/types/randomPicker";

export function isPopularProvider(p: PickerProvider): boolean {
  if (POPULAR_PROVIDER_IDS.has(p.id)) return true;
}

export function normalizeProviderName(name: string): string {
  return name.toLowerCase().trim();
}

export function getCountryName(code: string, locale: string): string {
  try {
    const lang = locale === "en" ? "en-US" : "es-419";
    const names = new Intl.DisplayNames([lang], { type: "region" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

export function sortCountries(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const pa = COUNTRY_PRIORITY[a] ?? 99;
    const pb = COUNTRY_PRIORITY[b] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

/** Returns providers visible to an item under the current country selection */
export function getItemRegionProviders(
  item: RandomPickerItem,
  country: string,
): PickerProvider[] {
  return item.providersByRegion?.[country] ?? item.providers ?? [];
}

/** Fisher-Yates shuffle (returns a new array) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
