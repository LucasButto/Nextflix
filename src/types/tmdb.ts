// ─── Shared ───────────────────────────────────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  credit_id: string;
  order: number;
  popularity: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  credit_id: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface WatchProviderRegion {
  flatrate?: StreamingProvider[];
  rent?: StreamingProvider[];
  buy?: StreamingProvider[];
  link?: string;
}

export interface WatchProviders {
  results: Record<string, WatchProviderRegion>;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Videos {
  results: Video[];
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface CollectionInfo {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  profile_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  status?: string;
  tagline?: string;
  production_companies?: ProductionCompany[];
  media_type?: string;
}

export interface MovieDetails extends Movie {
  runtime: number;
  status: string;
  tagline: string;
  genres: Genre[];
  production_companies: ProductionCompany[];
  belongs_to_collection: CollectionInfo | null;
  credits: Credits;
  "watch/providers": WatchProviders;
  videos: Videos;
  recommendations: { results: Movie[] };
}

// ─── Series ───────────────────────────────────────────────────────────────────

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
  still_path: string | null;
}

export interface Series {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  genre_ids?: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  media_type?: string;
}

export interface SeriesDetails extends Series {
  genres: Genre[];
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  tagline: string;
  episode_run_time: number[];
  seasons: Season[];
  credits: Credits;
  "watch/providers": WatchProviders;
  videos: Videos;
  recommendations: { results: Series[] };
  next_episode_to_air: Episode | null;
  last_episode_to_air: Episode | null;
}

export interface SeasonDetails {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

// ─── Actors ───────────────────────────────────────────────────────────────────

export interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  gender?: number;
}

export interface ActorDetails extends Actor {
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  movie_credits: { cast: (Movie & { credit_id: string })[] };
  tv_credits: { cast: (Series & { credit_id: string })[] };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export type MovieResult = Movie & { media_type: "movie" };
export type SeriesResult = Series & { media_type: "tv" };
export type PersonResult = Actor & { media_type: "person" };
export type SearchResult = MovieResult | SeriesResult | PersonResult;
export type HeroBannerItem = (Movie | Series) & { media_type?: string };

export interface SearchResponse {
  results: SearchResult[];
  total_pages: number;
  total_results: number;
  page: number;
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface PageParams {
  id: string;
}
