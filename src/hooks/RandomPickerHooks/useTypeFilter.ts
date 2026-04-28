"use client";
import { useMemo, useState } from "react";
import type { RandomPickerItem } from "@/types/randomPicker";

export function useTypeFilter(items: RandomPickerItem[]) {
  const hasMovies = useMemo(
    () => items.some((i) => i.media_type === "movie"),
    [items],
  );
  const hasSeries = useMemo(
    () => items.some((i) => i.media_type === "tv"),
    [items],
  );
  const showTypeFilters = hasMovies && hasSeries;

  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeSeries, setIncludeSeries] = useState(true);

  const typeFilteredItems = useMemo(
    () =>
      items.filter((it) => {
        if (it.media_type === "movie") return includeMovies;
        if (it.media_type === "tv") return includeSeries;
        return false;
      }),
    [items, includeMovies, includeSeries],
  );

  const noTypeFilter = showTypeFilters && !includeMovies && !includeSeries;

  return {
    showTypeFilters,
    includeMovies,
    setIncludeMovies,
    includeSeries,
    setIncludeSeries,
    typeFilteredItems,
    noTypeFilter,
  };
}
