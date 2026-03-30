import { tmdbFetch } from './tmdb';

export async function getActorDetails(personId: string | number) {
  return tmdbFetch(`/person/${personId}`, {
    append_to_response: 'movie_credits,tv_credits,images',
  });
}

export async function getPopularActors(page = 1) {
  const data = await tmdbFetch('/person/popular', { page });
  return data.results;
}
