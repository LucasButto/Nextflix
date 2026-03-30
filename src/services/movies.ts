import { tmdbFetch } from './tmdb';

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'day') {
  const data = await tmdbFetch(`/trending/movie/${timeWindow}`);
  return data.results;
}

export async function getPopularMovies(page = 1) {
  const data = await tmdbFetch('/movie/popular', { page });
  return data.results;
}

export async function getTopRatedMovies(page = 1) {
  const data = await tmdbFetch('/movie/top_rated', { page });
  return data.results;
}

export async function getNowPlayingMovies(page = 1) {
  const data = await tmdbFetch('/movie/now_playing', { page });
  return data.results;
}

export async function getUpcomingMovies(page = 1) {
  const data = await tmdbFetch('/movie/upcoming', { page });
  return data.results;
}

export async function getMoviesByGenre(genreId: number, page = 1) {
  const data = await tmdbFetch('/discover/movie', {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page,
  });
  return data.results;
}

export async function getMovieDetails(movieId: string | number) {
  return tmdbFetch(`/movie/${movieId}`, {
    append_to_response: 'credits,watch/providers,videos,similar,recommendations',
  });
}
