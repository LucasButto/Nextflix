import { tmdbFetch, TmdbListResponse, filterLatinScript } from "./tmdb";
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

const TOP100_MOVIES_MIN_VOTES = 2000;

export async function getTop100Movies() {
  const pages = await Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((page) =>
      tmdbFetch<TmdbListResponse<Movie>>("/movie/top_rated", { page })
        .then((d) => filterLatinScript(d.results))
        .catch(() => [] as Movie[]),
    ),
  );

  const seen = new Set<number>();
  return pages
    .flat()
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return m.vote_count >= TOP100_MOVIES_MIN_VOTES;
    })
    .sort((a, b) => {
      const ratingDiff =
        Math.round(b.vote_average * 10) - Math.round(a.vote_average * 10);
      return ratingDiff !== 0 ? ratingDiff : b.vote_count - a.vote_count;
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

/**
 * Obtiene películas anime populares (animación japonesa).
 * NO aplica filterLatinScript para permitir contenido en japonés.
 * Excluido automáticamente del Top 100 y los carruseles de género por filterLatinScript.
 */
export async function getAnimeMovies() {
  const [page1, page2] = await Promise.all([
    tmdbFetch<TmdbListResponse<Movie>>("/discover/movie", {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
      page: 1,
    })
      .then((d) => d.results)
      .catch(() => [] as Movie[]),
    tmdbFetch<TmdbListResponse<Movie>>("/discover/movie", {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
      page: 2,
    })
      .then((d) => d.results)
      .catch(() => [] as Movie[]),
  ]);

  const seen = new Set<number>();
  return [...page1, ...page2].filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export async function getMovieDetails(
  movieId: string | number,
  language?: string,
) {
  return tmdbFetch<MovieDetails>(
    `/movie/${movieId}`,
    {
      append_to_response:
        "credits,watch/providers,videos,recommendations,release_dates,images",
      include_video_language: "en,null",
      include_image_language: "en,null",
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
