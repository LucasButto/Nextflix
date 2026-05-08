import { tmdbFetch, TmdbListResponse, filterLatinScript } from "./tmdb";
import { getOmdbRating } from "./omdb";
import type {
  Movie,
  MovieDetails,
  CollectionDetails,
  ExternalIds,
} from "@/types/tmdb";

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

// ─── Top 100 enriquecido con IMDb (vía OMDb) ────────────────────────────────
//
// Constantes del algoritmo:
//   POOL_PAGES         = páginas de TMDB top_rated a traer (~20 por pág).
//                        Más amplio que getTop100Movies para tener margen al
//                        filtrar por cantidad de votos en IMDb.
//   MIN_TMDB_VOTES     = filtro mínimo de votos en TMDB (sanity check).
//   MIN_IMDB_VOTES     = filtro principal: refleja el filtro Bayesiano que
//                        usa IMDb para su Top 250. Top 100 reales tienen 100k+.
//   MIN_IMDB_VOTES_RELAXED = si con el estricto no llegamos a 100, relajamos.
//   HEALTHCHECK_MIN    = si MENOS items tienen rating IMDb, asumimos que OMDb
//                        está caído y caemos al ranking TMDB puro.
const TOP100_POOL_PAGES = 15;
const TOP100_MIN_TMDB_VOTES = 2000;
const TOP100_MIN_IMDB_VOTES = 100_000;
const TOP100_MIN_IMDB_VOTES_RELAXED = 50_000;
const TOP100_TARGET = 100;
const TOP100_HEALTHCHECK_MIN = 50;

/**
 * Top 100 películas con criterios cercanos al Top 100 real de IMDb.
 *
 * Diseño:
 *   1. Trae un pool amplio de TMDB top_rated (~300 películas).
 *   2. Para cada una, en lotes paralelos:
 *      - external_ids (TMDB) → imdb_id
 *      - rating IMDb (OMDb)
 *   3. Si OMDb está caído (cuota agotada), fallback al ranking TMDB puro.
 *   4. Filtra por cantidad de votos en IMDb (≥ 100k). Este filtro es la clave
 *      para parecernos a IMDb: sin él, películas con rating alto pero pocos
 *      votos (tipo Gabriel's Inferno) distorsionan el ranking.
 *   5. Ordena por rating IMDb descendente, votos como desempate.
 *   6. Toma top 100.
 *
 * Si después de filtrar no llegamos a 100, relaja el filtro automáticamente
 * (50k votos, después sin filtro). El resultado SIEMPRE tiene ≤ 100 items.
 *
 * Cacheado al nivel de fetch (24h vía OMDb, 10min vía TMDB). Cold-start
 * típico: ~250 llamadas a OMDb. Caliente: 0.
 */
export async function getTop100MoviesEnhanced(): Promise<Movie[]> {
  // 1. Pool amplio desde TMDB top_rated
  const pages = await Promise.all(
    Array.from({ length: TOP100_POOL_PAGES }, (_, i) => i + 1).map((page) =>
      tmdbFetch<TmdbListResponse<Movie>>("/movie/top_rated", { page })
        .then((d) => filterLatinScript(d.results))
        .catch(() => [] as Movie[]),
    ),
  );

  const seen = new Set<number>();
  const pool = pages.flat().filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return m.vote_count >= TOP100_MIN_TMDB_VOTES;
  });

  if (pool.length === 0) return [];

  // 2. Enriquecemos con imdb_id + rating IMDb
  const BATCH = 15;
  const enriched: Movie[] = [];
  for (let i = 0; i < pool.length; i += BATCH) {
    const batch = pool.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (m): Promise<Movie> => {
        let imdbId: string | null = null;
        try {
          // external_ids es muy liviano vs movie details completo
          const ext = await tmdbFetch<ExternalIds>(
            `/movie/${m.id}/external_ids`,
          );
          imdbId = ext?.imdb_id ?? null;
        } catch {
          imdbId = null;
        }
        const omdb = await getOmdbRating(imdbId);
        return {
          ...m,
          imdb_rating: omdb?.rating ?? null,
          imdb_votes: omdb?.votes ?? 0,
        };
      }),
    );
    enriched.push(...results);
  }

  // 3. Healthcheck OMDb: si demasiadas movies no tienen rating IMDb,
  //    asumimos que la cuota está agotada o la API está caída → fallback
  //    al top 100 puro de TMDB para que el usuario SIEMPRE vea 100 películas.
  const withImdb = enriched.filter((m) => m.imdb_rating !== null);
  if (withImdb.length < TOP100_HEALTHCHECK_MIN) {
    return enriched
      .sort((a, b) => {
        const diff =
          Math.round(b.vote_average * 10) - Math.round(a.vote_average * 10);
        return diff !== 0 ? diff : b.vote_count - a.vote_count;
      })
      .slice(0, TOP100_TARGET);
  }

  // 4. Filtro por cantidad de votos IMDb (proxy del filtro Bayesiano).
  //    Adaptativo: si el estricto no nos da 100, relajamos.
  let qualifying = withImdb.filter(
    (m) => (m.imdb_votes ?? 0) >= TOP100_MIN_IMDB_VOTES,
  );
  if (qualifying.length < TOP100_TARGET) {
    qualifying = withImdb.filter(
      (m) => (m.imdb_votes ?? 0) >= TOP100_MIN_IMDB_VOTES_RELAXED,
    );
  }
  if (qualifying.length < TOP100_TARGET) {
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
    .slice(0, TOP100_TARGET);
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
