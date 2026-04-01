import { tmdbFetch, TmdbListResponse } from "./tmdb";
import type { Actor, ActorDetails } from "@/types/tmdb";

export async function getActorDetails(personId: string | number) {
  return tmdbFetch<ActorDetails>(`/person/${personId}`, {
    append_to_response: "movie_credits,tv_credits,images",
  });
}

export async function getPopularActors(page = 1) {
  const data = await tmdbFetch<TmdbListResponse<Actor>>("/person/popular", {
    page,
  });
  return data.results;
}
