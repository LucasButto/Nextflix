import { tmdbFetch } from './tmdb';

export async function searchMulti(query: string, page = 1) {
  if (!query || query.trim() === '') return { results: [], total_pages: 0 };
  return tmdbFetch('/search/multi', { query, page });
}

export async function searchMovies(query: string, page = 1) {
  if (!query) return { results: [], total_pages: 0 };
  return tmdbFetch('/search/movie', { query, page });
}

export async function searchSeries(query: string, page = 1) {
  if (!query) return { results: [], total_pages: 0 };
  return tmdbFetch('/search/tv', { query, page });
}
