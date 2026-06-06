import { tmdbFetch, TmdbListResponse, filterLatinScript } from "./tmdb";
import { getLocale } from "next-intl/server";
import type {
  Series,
  SeriesDetails,
  SeasonDetails,
  Videos,
  EpisodeDetails,
} from "@/types/tmdb";

export async function getTrendingSeries(timeWindow: "day" | "week" = "day") {
  const pages = await Promise.all(
    [1, 2].map((page) =>
      tmdbFetch<TmdbListResponse<Series>>(`/trending/tv/${timeWindow}`, {
        page,
      })
        .then((d) => filterLatinScript(d.results))
        .catch(() => [] as Series[]),
    ),
  );
  const seen = new Set<number>();
  return pages.flat().filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export async function getPopularSeries(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Series>>("/tv/popular", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getTopRatedSeries(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Series>>("/tv/top_rated", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getAiringTodaySeries(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Series>>("/tv/airing_today", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getOnTheAirSeries(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Series>>("/tv/on_the_air", {
    page,
  });
  return filterLatinScript(data.results);
}

// ─── Top 100 Series ────────────────────────────────────────────────────────

/** Mínimo de votos a nivel de serie para entrar al pool de candidatos. */
const TOP100_SERIES_MIN_VOTES = 2500;
const MIN_EPISODE_VOTES = 12;
const MIN_EPISODE_RATING = 5.8;

export async function getTop100Series() {
  // ── 1. Obtener candidatos de las páginas top_rated ──────────────────────
  const pages = await Promise.all(
    Array.from({ length: 58 }, (_, i) => i + 1).map((page) =>
      tmdbFetch<TmdbListResponse<Series>>("/tv/top_rated", { page })
        .then((d) => filterLatinScript(d.results))
        .catch(() => [] as Series[]),
    ),
  );

  const seen = new Set<number>();
  const candidates = pages
    .flat()
    .filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return s.vote_count >= TOP100_SERIES_MIN_VOTES;
    })
    .sort((a, b) => {
      const diff =
        Math.round(b.vote_average * 10) - Math.round(a.vote_average * 10);
      return diff !== 0 ? diff : b.vote_count - a.vote_count;
    });

  // ── 2. Filtrar por calidad de episodios (primeras 3 temporadas) ─────────
  type SeasonSlim = {
    episodes?: Array<{ vote_count?: number; vote_average?: number }>;
  };

  const toCheck = candidates.slice(0, 150);

  const passesFilter = await Promise.all(
    toCheck.map(async (series): Promise<boolean> => {
      try {
        const seasonResults = await Promise.allSettled([
          tmdbFetch<SeasonSlim>(`/tv/${series.id}/season/1`),
          tmdbFetch<SeasonSlim>(`/tv/${series.id}/season/2`),
          tmdbFetch<SeasonSlim>(`/tv/${series.id}/season/3`),
        ]);

        for (const result of seasonResults) {
          // Temporada inexistente (404 u otro error) → omitir
          if (result.status !== "fulfilled") continue;

          const rated = (result.value.episodes ?? []).filter(
            (ep) => typeof ep.vote_count === "number" && ep.vote_count > 0,
          );

          // Temporada sin episodios calificados aún → no penalizar
          if (rated.length === 0) continue;

          // Si algún episodio calificado falla cualquiera de los dos filtros
          // → la serie entera queda fuera
          const seasonPasses = rated.every(
            (ep) =>
              (ep.vote_count ?? 0) >= MIN_EPISODE_VOTES &&
              (ep.vote_average ?? 10) >= MIN_EPISODE_RATING,
          );

          if (!seasonPasses) return false;
        }

        return true;
      } catch {
        // Ante error inesperado → incluir igual (fail-open)
        return true;
      }
    }),
  );

  return toCheck.filter((_, i) => passesFilter[i]).slice(0, 100);
}

export async function getSeriesByGenre(genreId: number, page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Series>>("/discover/tv", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    "vote_count.gte": 50,
    page,
  });
  return filterLatinScript(data.results);
}

export async function getAnimeSeries() {
  const [page1, page2] = await Promise.all([
    tmdbFetch<TmdbListResponse<Series>>("/discover/tv", {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
      "vote_count.gte": 100,
      page: 1,
    })
      .then((d) => d.results)
      .catch(() => [] as Series[]),
    tmdbFetch<TmdbListResponse<Series>>("/discover/tv", {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
      "vote_count.gte": 100,
      page: 2,
    })
      .then((d) => d.results)
      .catch(() => [] as Series[]),
  ]);

  const seen = new Set<number>();
  return [...page1, ...page2].filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export async function getSeriesDetails(
  seriesId: string | number,
  language?: string,
) {
  return tmdbFetch<SeriesDetails>(
    `/tv/${seriesId}`,
    {
      append_to_response:
        "credits,watch/providers,videos,recommendations,content_ratings,external_ids",
      include_video_language: "en,null",
    },
    language,
  );
}

export async function getSeasonDetails(
  seriesId: string | number,
  seasonNumber: number,
) {
  return tmdbFetch<SeasonDetails>(`/tv/${seriesId}/season/${seasonNumber}`);
}

export async function getSeasonVideos(
  seriesId: string | number,
  seasonNumber: number,
) {
  return tmdbFetch<Videos>(
    `/tv/${seriesId}/season/${seasonNumber}/videos`,
    {},
    "en-US",
  );
}

const TV_GENRE_NAME_OVERRIDES_ES: Record<number, string> = {
  10759: "Acción y Aventura",
  10765: "Ciencia Ficción y Fantasía",
  10768: "Bélica y Política",
};

export async function getTVGenreList(): Promise<
  { id: number; name: string }[]
> {
  try {
    const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
      "/genre/tv/list",
    );
    const language = await getLocale().catch(() => "es");
    if (language === "es") {
      return data.genres.map((g) => ({
        ...g,
        name: TV_GENRE_NAME_OVERRIDES_ES[g.id] ?? g.name,
      }));
    }
    return data.genres;
  } catch {
    const { TV_GENRES } = await import("./tmdb");
    return TV_GENRES;
  }
}

export async function getEpisodeDetails(
  seriesId: string | number,
  seasonNumber: number,
  episodeNumber: number,
  language?: string,
) {
  return tmdbFetch<EpisodeDetails>(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
    {
      append_to_response: "credits,images,videos,external_ids",
      include_image_language: "en,null",
      include_video_language: "en,null",
    },
    language,
  );
}
