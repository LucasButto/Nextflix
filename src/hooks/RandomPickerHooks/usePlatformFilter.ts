"use client";
import { useMemo, useState } from "react";
import {
  getItemRegionProviders,
  isPopularProvider,
  normalizeProviderName,
} from "@/utils/randomPicker";
import type { PickerProvider, RandomPickerItem } from "@/types/randomPicker";

interface UsePlatformFilterArgs {
  typeFilteredItems: RandomPickerItem[];
  effectiveCountry: string;
}

export function usePlatformFilter({
  typeFilteredItems,
  effectiveCountry,
}: UsePlatformFilterArgs) {
  const [providerFilter, setProviderFilter] = useState<{
    country: string;
    names: Set<string>;
  } | null>(null);

  // Si el país cambió, la selección anterior se ignora (derivado en render)
  const selectedNames =
    providerFilter?.country === effectiveCountry ? providerFilter.names : null;

  // Providers únicos por nombre normalizado
  const allProviders = useMemo(() => {
    const seen = new Map<string, PickerProvider>();
    for (const item of typeFilteredItems) {
      const regionProviders = getItemRegionProviders(item, effectiveCountry);
      for (const p of regionProviders) {
        const key = normalizeProviderName(p.name);
        if (!seen.has(key)) seen.set(key, p);
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [typeFilteredItems, effectiveCountry]);

  const popularProviders = useMemo(
    () => allProviders.filter(isPopularProvider),
    [allProviders],
  );
  const otherProviders = useMemo(
    () => allProviders.filter((p) => !isPopularProvider(p)),
    [allProviders],
  );

  const toggleProvider = (name: string) => {
    const key = normalizeProviderName(name);
    setProviderFilter((prev) => {
      if (prev === null || prev.country !== effectiveCountry) {
        return { country: effectiveCountry, names: new Set([key]) };
      }
      const next = new Set(prev.names);
      if (next.has(key)) {
        next.delete(key);
        return next.size === 0
          ? null
          : { country: effectiveCountry, names: next };
      }
      next.add(key);
      return { country: effectiveCountry, names: next };
    });
  };

  const resetProviders = () => setProviderFilter(null);

  const selectedCount = selectedNames?.size ?? 0;
  const singleSelected =
    selectedCount === 1
      ? (allProviders.find((p) =>
          selectedNames!.has(normalizeProviderName(p.name)),
        ) ?? null)
      : null;

  return {
    allProviders,
    popularProviders,
    otherProviders,
    selectedNames,
    selectedCount,
    singleSelected,
    toggleProvider,
    resetProviders,
  };
}
