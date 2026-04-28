"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import RandomPicker from "@/components/myList/RandomPicker/RandomPicker";
import type {
  RandomPickerItem,
  PickerProvider,
} from "@/components/myList/RandomPicker/RandomPicker";
import { tmdbClientFetch } from "@/services/tmdb-client";
import { IMG_BASE } from "@/services/tmdb";

const PROVIDER_REGIONS = ["AR", "MX", "CO", "CL", "US", "GB"];

interface WatchProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface WatchProvidersResponse {
  id: number;
  results: Record<string, { flatrate?: WatchProviderEntry[] }>;
}

async function withConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
  return results;
}

interface Top100PickerButtonProps {
  items: RandomPickerItem[];
}

export default function Top100PickerButton({ items }: Top100PickerButtonProps) {
  const t = useTranslations("myList.randomPicker");
  const [open, setOpen] = useState(false);
  const [enrichedItems, setEnrichedItems] = useState<RandomPickerItem[] | null>(
    null,
  );
  const [loadingProviders, setLoadingProviders] = useState(false);
  const fetchedRef = useRef(false);

  const handleOpen = () => {
    setOpen(true);
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoadingProviders(true);

    withConcurrency(
      items.map((item) => async (): Promise<RandomPickerItem> => {
        try {
          // Cada item sabe su propio tipo — funciona para listas mixtas (My List)
          const tmdbType = item.media_type === "tv" ? "tv" : "movie";
          const data = await tmdbClientFetch<WatchProvidersResponse>(
            `/${tmdbType}/${item.id}/watch/providers`,
            "en",
          );
          let providers: PickerProvider[] = [];
          for (const region of PROVIDER_REGIONS) {
            const flatrate = data.results?.[region]?.flatrate;
            if (flatrate?.length) {
              providers = flatrate.map((p) => ({
                id: p.provider_id,
                name: p.provider_name,
                logo_path: `${IMG_BASE}/w45${p.logo_path}`,
              }));
              break;
            }
          }
          return { ...item, providers };
        } catch {
          return { ...item, providers: [] };
        }
      }),
      15,
    ).then((enriched) => {
      setEnrichedItems(enriched);
      setLoadingProviders(false);
    });
  };

  return (
    <>
      <button
        type="button"
        className="watchlist-random-btn"
        onClick={handleOpen}
      >
        <CasinoRoundedIcon />
        <span>{t("openButton")}</span>
      </button>
      {open && (
        <RandomPicker
          items={enrichedItems ?? items}
          loadingProviders={loadingProviders}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
