const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";

export const IMAGE_SIZES = {
  poster: { sm: "/w342", md: "/w500", lg: "/w780", original: "/original" },
  backdrop: { sm: "/w780", md: "/w1280", original: "/original" },
  profile: { sm: "/w185", md: "/w342", lg: "/h632", original: "/original" },
};

export function posterUrl(
  path: string | null,
  size: "sm" | "md" | "lg" | "original" = "md",
) {
  if (!path) return "/no-poster.svg";
  return `${IMG_BASE}${IMAGE_SIZES.poster[size]}${path}`;
}

export function backdropUrl(
  path: string | null,
  size: "sm" | "md" | "original" = "original",
) {
  if (!path) return null;
  return `${IMG_BASE}${IMAGE_SIZES.backdrop[size]}${path}`;
}

export function profileUrl(
  path: string | null,
  size: "sm" | "md" | "lg" | "original" = "md",
) {
  if (!path) return "/no-avatar.svg";
  return `${IMG_BASE}${IMAGE_SIZES.profile[size]}${path}`;
}

type TmdbParams = Record<string, string | number | boolean>;
type TmdbCacheEntry = { data: unknown; timestamp: number };

const cache = new Map<string, TmdbCacheEntry>();
const CACHE_TTL = 10 * 60 * 1000;

export async function tmdbFetch(
  endpoint: string,
  params: TmdbParams = {},
): Promise<unknown> {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY ?? "",
    language: "es-ES",
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });
  const url = `${BASE_URL}${endpoint}?${queryParams}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  const data: unknown = await res.json();

  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

export const MOVIE_GENRES = [
  { id: 28, name: "Acción", slug: "accion" },
  { id: 12, name: "Aventura", slug: "aventura" },
  { id: 16, name: "Animación", slug: "animacion" },
  { id: 35, name: "Comedia", slug: "comedia" },
  { id: 80, name: "Crimen", slug: "crimen" },
  { id: 99, name: "Documental", slug: "documental" },
  { id: 18, name: "Drama", slug: "drama" },
  { id: 10751, name: "Familia", slug: "familia" },
  { id: 14, name: "Fantasía", slug: "fantasia" },
  { id: 36, name: "Historia", slug: "historia" },
  { id: 27, name: "Terror", slug: "terror" },
  { id: 10402, name: "Música", slug: "musica" },
  { id: 9648, name: "Misterio", slug: "misterio" },
  { id: 10749, name: "Romance", slug: "romance" },
  { id: 878, name: "Ciencia ficción", slug: "ciencia-ficcion" },
  { id: 53, name: "Suspenso", slug: "suspenso" },
  { id: 10752, name: "Bélica", slug: "belica" },
  { id: 37, name: "Western", slug: "western" },
];

export const TV_GENRES = [
  { id: 10759, name: "Acción y Aventura", slug: "accion-aventura" },
  { id: 16, name: "Animación", slug: "animacion" },
  { id: 35, name: "Comedia", slug: "comedia" },
  { id: 80, name: "Crimen", slug: "crimen" },
  { id: 99, name: "Documental", slug: "documental" },
  { id: 18, name: "Drama", slug: "drama" },
  { id: 10751, name: "Familia", slug: "familia" },
  { id: 10762, name: "Kids", slug: "kids" },
  { id: 9648, name: "Misterio", slug: "misterio" },
  { id: 10763, name: "Noticias", slug: "noticias" },
  { id: 10764, name: "Reality", slug: "reality" },
  { id: 10765, name: "Sci-Fi & Fantasy", slug: "sci-fi-fantasy" },
  { id: 10768, name: "Bélica & Política", slug: "belica-politica" },
  { id: 37, name: "Western", slug: "western" },
];
