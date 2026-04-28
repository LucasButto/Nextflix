"use client";
import { useMemo, useState } from "react";
import { sortCountries } from "@/utils/randomPicker";
import type { RandomPickerItem } from "@/types/randomPicker";

export function useCountryFilter(items: RandomPickerItem[]) {
  const hasRegionData = useMemo(
    () => items.some((i) => i.providersByRegion !== undefined),
    [items],
  );

  const availableCountries = useMemo(() => {
    if (!hasRegionData) return [];
    const set = new Set<string>();
    for (const item of items) {
      for (const code of Object.keys(item.providersByRegion ?? {})) {
        set.add(code);
      }
    }
    return sortCountries(Array.from(set));
  }, [items, hasRegionData]);

  const defaultCountry = availableCountries.includes("AR")
    ? "AR"
    : (availableCountries[0] ?? "AR");

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);

  // Si availableCountries cambia y ya no incluye el seleccionado, caemos al
  // primero disponible (derivado en render, sin mutar estado)
  const effectiveCountry =
    availableCountries.length === 0 ||
    availableCountries.includes(selectedCountry)
      ? selectedCountry
      : availableCountries[0];

  return {
    hasRegionData,
    availableCountries,
    effectiveCountry,
    setSelectedCountry,
  };
}
