import { tmdbFetch, TmdbListResponse, filterLatinScript } from "./tmdb";
import { getOmdbRating } from "./omdb";
import { getLocale } from "next-intl/server";
import type {
  Series,
  SeriesDetails,
  SeasonDetails,
  Videos,
  EpisodeDetails,
  ExternalIds,
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

const TOP100_SERIES_MIN_VOTES = 2100;

export async function getTop100Series() {
  const pages = await Promise.all(
    [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    ].map((page) =>
      tmdbFetch<TmdbListResponse<Series>>("/tv/top_rated", { page })
        .then((d) => filterLatinScript(d.results))
        .catch(() => [] as Series[]),
    ),
  );

  const seen = new Set<number>();
  return pages
    .flat()
    .filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return s.vote_count >= TOP100_SERIES_MIN_VOTES;
    })
    .sort((a, b) => {
      const ratingDiff =
        Math.round(b.vote_average * 10) - Math.round(a.vote_average * 10);
      return ratingDiff !== 0 ? ratingDiff : b.vote_count - a.vote_count;
    })
    .slice(0, 100);
}

// ─── Top 100 series enriquecido con IMDb (vía OMDb) ────────────────────────
//
// Mismo diseño que getTop100MoviesEnhanced pero con umbrales adaptados a series:
// - Pool más grande (series tienen más variación)
// - Umbral de votos IMDb más bajo (50k vs 100k de movies)
//
// Las series suelen tener menos votos que las películas en IMDb.
const TOP100_SERIES_POOL_PAGES = 20;
const TOP100_SERIES_MIN_TMDB_VOTES = 1000;
const TOP100_SERIES_MIN_IMDB_VOTES = 50_000;
const TOP100_SERIES_MIN_IMDB_VOTES_RELAXED = 20_000;
const TOP100_SERIES_TARGET = 100;
const TOP100_SERIES_HEALTHCHECK_MIN = 50;

/**
 * Top 100 series con criterios cercanos al Top 100 real de IMDb.
 * Ver `getTop100MoviesEnhanced` en movies.ts para detalles del algoritmo.
 */
export async function getTop100SeriesEnhanced(): Promise<Series[]> {
  // 1. Pool amplio desde TMDB top_rated
  const pages = await Promise.all(
    Array.from({ length: TOP100_SERIES_POOL_PAGES }, (_, i) => i + 1).map(
      (page) =>
        tmdbFetch<TmdbListResponse<Series>>("/tv/top_rated", { page })
          .then((d) => filterLatinScript(d.results))
          .catch(() => [] as Series[]),
    ),
  );

  const seen = new Set<number>();
  const pool = pages.flat().filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return s.vote_count >= TOP100_SERIES_MIN_TMDB_VOTES;
  });

  if (pool.length === 0) return [];

  // 2. Enriquecemos con imdb_id + rating IMDb
  const BATCH = 15;
  const enriched: Series[] = [];
  for (let i = 0; i < pool.length; i += BATCH) {
    const batch = pool.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (s): Promise<Series> => {
        let imdbId: string | null = null;
        try {
          const ext = await tmdbFetch<ExternalIds>(`/tv/${s.id}/external_ids`);
          imdbId = ext?.imdb_id ?? null;
        } catch {
          imdbId = null;
        }
        const omdb = await getOmdbRating(imdbId);
        return {
          ...s,
          imdb_rating: omdb?.rating ?? null,
          imdb_votes: omdb?.votes ?? 0,
        };
      }),
    );
    enriched.push(...results);
  }

  // 3. Healthcheck OMDb → fallback al ranking TMDB puro si no hay datos
  const withImdb = enriched.filter((s) => s.imdb_rating !== null);
  if (withImdb.length < TOP100_SERIES_HEALTHCHECK_MIN) {
    return enriched
      .sort((a, b) => {
        const diff =
          Math.round(b.vote_average * 10) - Math.round(a.vote_average * 10);
        return diff !== 0 ? diff : b.vote_count - a.vote_count;
      })
      .slice(0, TOP100_SERIES_TARGET);
  }

  // 4. Filtro adaptativo por cantidad de votos en IMDb
  let qualifying = withImdb.filter(
    (s) => (s.imdb_votes ?? 0) >= TOP100_SERIES_MIN_IMDB_VOTES,
  );
  if (qualifying.length < TOP100_SERIES_TARGET) {
    qualifying = withImdb.filter(
      (s) => (s.imdb_votes ?? 0) >= TOP100_SERIES_MIN_IMDB_VOTES_RELAXED,
    );
  }
  if (qualifying.length < TOP100_SERIES_TARGET) {
    qualifying = withImdb;
  }

  // 5. Ordenamos por rating IMDb desc, votos como desempate
  return qualifying
    .sort((a, b) => {
      const ratingDiff =
        Math.round((b.imdb_rating ?? 0) * 10) -
        Math.round((a.imdb_rating ?? 0) * 10);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.imdb_votes ?? 0) - (a.imdb_votes ?? 0);
    })
    .slice(0, TOP100_SERIES_TARGET);
}

export async function getSeriesByGenre(genreId: number) {
  const [page1, page2] = await Promise.all([
    tmdbFetch<TmdbListResponse<Series>>("/discover/tv", {
      with_genres: genreId,
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
      page: 1,
    })
      .then((d) => filterLatinScript(d.results))
      .catch(() => [] as Series[]),
    tmdbFetch<TmdbListResponse<Series>>("/discover/tv", {
      with_genres: genreId,
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
      page: 2,
    })
      .then((d) => filterLatinScript(d.results))
      .catch(() => [] as Series[]),
  ]);

  const seen = new Set<number>();
  return [...page1, ...page2].filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

/**
 * Obtiene series de anime populares (animación japonesa).
 * NO aplica filterLatinScript para permitir contenido en japonés.
 * Excluido automáticamente del Top 100 y los carruseles de género por filterLatinScript.
 */
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

// Overrides para nombres de géneros que TMDB no traduce correctamente en es-MX
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

/**
 * Detalle completo de un episodio, incluyendo credits (guest stars + crew),
 * images (stills), videos (YouTube) y external_ids (IMDB).
 * Usa append_to_response para consolidar todo en una sola llamada.
 */
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
