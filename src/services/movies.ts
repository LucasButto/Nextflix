import { tmdbFetch, TmdbListResponse, filterLatinScript } from "./tmdb";
import { getLocale } from "next-intl/server";
import type { Movie, MovieDetails, CollectionDetails } from "@/types/tmdb";

export async function getTrendingMovies(timeWindow: "day" | "week" = "day") {
  const pages = await Promise.all(
    [1, 2].map((page) =>
      tmdbFetch<TmdbListResponse<Movie>>(`/trending/movie/${timeWindow}`, {
        page,
      })
        .then((d) => filterLatinScript(d.results))
        .catch(() => [] as Movie[]),
    ),
  );
  const seen = new Set<number>();
  return pages.flat().filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Movie>>("/movie/popular", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getTopRatedMovies(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Movie>>("/movie/top_rated", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getNowPlayingMovies(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Movie>>("/movie/now_playing", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getUpcomingMovies(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Movie>>("/movie/upcoming", {
    page,
  });
  return filterLatinScript(data.results);
}

export async function getTop100Movies() {
  const pages = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map((page) =>
      tmdbFetch<TmdbListResponse<Movie>>("/movie/top_rated", { page }),
    ),
  );

  const seen = new Set<number>();
  return pages
    .flatMap((page) => page.results)
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .slice(0, 100);
}
export async function getMoviesByGenre(genreId: number, page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Movie>>("/discover/movie", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    "vote_count.gte": 50,
    page,
  });
  return filterLatinScript(data.results);
}

export async function getMovieDetails(
  movieId: string | number,
  language?: string,
) {
  return tmdbFetch<MovieDetails>(
    `/movie/${movieId}`,
    {
      append_to_response:
        "credits,watch/providers,videos,recommendations,release_dates",
    },
    language,
  );
}

export async function getCollectionDetails(collectionId: number) {
  return tmdbFetch<CollectionDetails>(`/collection/${collectionId}`);
}

export async function getMovieGenreList(): Promise<
  { id: number; name: string }[]
> {
  try {
    const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
      "/genre/movie/list",
    );
    return data.genres;
  } catch {
    // Fallback a géneros en español si falla
    const { MOVIE_GENRES } = await import("./tmdb");
    return MOVIE_GENRES;
  }
}
