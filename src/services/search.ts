import { tmdbFetch } from "./tmdb";

export async function searchMulti(query: string, language?: string, page = 1) {
  if (!query || query.trim() === "") return { results: [], total_pages: 0 };
  return tmdbFetch("/search/multi", { query, page }, language);
}

export async function searchMovies(query: string, language?: string, page = 1) {
  if (!query) return { results: [], total_pages: 0 };
  return tmdbFetch("/search/movie", { query, page }, language);
}

export async function searchSeries(query: string, language?: string, page = 1) {
  if (!query) return { results: [], total_pages: 0 };
  return tmdbFetch("/search/tv", { query, page }, language);
}
