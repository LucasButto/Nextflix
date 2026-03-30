import { tmdbFetch } from './tmdb';

export async function getTrendingSeries(timeWindow: 'day' | 'week' = 'day') {
  const data = await tmdbFetch(`/trending/tv/${timeWindow}`);
  return data.results;
}

export async function getPopularSeries(page = 1) {
  const data = await tmdbFetch('/tv/popular', { page });
  return data.results;
}

export async function getTopRatedSeries(page = 1) {
  const data = await tmdbFetch('/tv/top_rated', { page });
  return data.results;
}

export async function getAiringTodaySeries(page = 1) {
  const data = await tmdbFetch('/tv/airing_today', { page });
  return data.results;
}

export async function getOnTheAirSeries(page = 1) {
  const data = await tmdbFetch('/tv/on_the_air', { page });
  return data.results;
}

export async function getSeriesByGenre(genreId: number, page = 1) {
  const data = await tmdbFetch('/discover/tv', {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page,
  });
  return data.results;
}

export async function getSeriesDetails(seriesId: string | number) {
  return tmdbFetch(`/tv/${seriesId}`, {
    append_to_response: 'credits,watch/providers,videos,similar,recommendations',
  });
}

export async function getSeasonDetails(seriesId: string | number, seasonNumber: number) {
  return tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`);
}
