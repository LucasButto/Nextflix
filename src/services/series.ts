import { tmdbFetch, TmdbListResponse, filterLatinScript } from "./tmdb";
import { getLocale } from "next-intl/server";
import type {
  Series,
  SeriesDetails,
  SeasonDetails,
  Videos,
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

const TOP100_SERIES_MIN_VOTES = 1750;

export async function getTop100Series() {
  const pages = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((page) =>
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

export async function getSeriesByGenre(genreId: number, page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Series>>("/discover/tv", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    "vote_count.gte": 50,
    page,
  });
  return filterLatinScript(data.results);
}

export async function getSeriesDetails(
  seriesId: string | number,
  language?: string,
) {
  return tmdbFetch<SeriesDetails>(
    `/tv/${seriesId}`,
    {
      append_to_response:
        "credits,watch/providers,videos,recommendations,content_ratings",
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
