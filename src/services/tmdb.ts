import { getLocale } from "next-intl/server";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";

export const IMAGE_SIZES = {
  poster: {
    xs: "/w185",
    sm: "/w342",
    md: "/w500",
    lg: "/w780",
    original: "/original",
  },
  backdrop: { sm: "/w780", md: "/w1280", original: "/original" },
  profile: { sm: "/w185", md: "/w342", lg: "/h632", original: "/original" },
};

export function posterUrl(
  path: string | null,
  size: "xs" | "sm" | "md" | "lg" | "original" = "md",
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

// ─── Locale → idioma TMDB ──────────────────────────────────────────────────
const LOCALE_TO_TMDB_LANG: Record<string, string> = {
  es: "es-MX", // Español Latino
  en: "en-US",
};

async function getTmdbLanguage(): Promise<string> {
  try {
    const locale = await getLocale();
    return LOCALE_TO_TMDB_LANG[locale] ?? "es-MX";
  } catch {
    // Fuera de contexto de request (ej: build estático)
    return "es-MX";
  }
}

type TmdbParams = Record<string, string | number | boolean>;
type TmdbCacheEntry = { data: unknown; timestamp: number };

const cache = new Map<string, TmdbCacheEntry>();
const CACHE_TTL = 10 * 60 * 1000;

// ─── Tipos de respuesta TMDB ───────────────────────────────────────────────
export interface TmdbListResponse<T> {
  results: T[];
  total_pages: number;
  total_results: number;
  page: number;
}

// tmdbFetch genérico: inferí el tipo de retorno en el callsite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tmdbFetch<T = any>(
  endpoint: string,
  params: TmdbParams = {},
  languageOverride?: string,
): Promise<T> {
  // languageOverride permite que componentes client pasen el locale explícitamente
  const language = languageOverride ?? (await getTmdbLanguage());

  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY ?? "",
    language,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });
  const url = `${BASE_URL}${endpoint}?${queryParams}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const res = await fetch(url, { next: { revalidate: 600 } } as RequestInit);
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  const data = (await res.json()) as T;

  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// ─── Filtro de idiomas con script no-latino ────────────────────────────────
const NON_LATIN_LANGUAGES = new Set([
  "ja",
  "ko",
  "zh",
  "th",
  "hi",
  "bn",
  "ta",
  "te",
  "ml",
  "kn",
  "mr",
  "gu",
  "pa",
  "si",
  "my",
  "km",
  "lo",
  "ar",
  "fa",
  "he",
  "ur",
  "ru",
  "uk",
  "bg",
  "mk",
  "be",
  "sr",
  "ka",
  "am",
  "hy",
  "mn",
]);

export function filterLatinScript<T extends { original_language: string }>(
  items: T[],
): T[] {
  return items.filter(
    (item) => !NON_LATIN_LANGUAGES.has(item.original_language),
  );
}

// ─── IDs de géneros (para filtrar por género) ─────────────────────────────
// Los nombres se obtienen dinámicamente de la API según el locale
// usando getMovieGenreList() / getTVGenreList() en services/movies.ts y series.ts
export const MOVIE_GENRE_IDS = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53,
  10752, 37,
];

export const TV_GENRE_IDS = [
  10759, 16, 35, 80, 99, 18, 10751, 10762, 9648, 10763, 10764, 10765, 10768, 37,
];

// Fallback: nombres en español por si falla la API de géneros
export const MOVIE_GENRES = [
  { id: 28, name: "Acción" },
  { id: 12, name: "Aventura" },
  { id: 16, name: "Animación" },
  { id: 35, name: "Comedia" },
  { id: 80, name: "Crimen" },
  { id: 99, name: "Documental" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Familia" },
  { id: 14, name: "Fantasía" },
  { id: 36, name: "Historia" },
  { id: 27, name: "Terror" },
  { id: 10402, name: "Música" },
  { id: 9648, name: "Misterio" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ciencia ficción" },
  { id: 53, name: "Suspenso" },
  { id: 10752, name: "Bélica" },
  { id: 37, name: "Western" },
];

export const TV_GENRES = [
  { id: 10759, name: "Acción y Aventura" },
  { id: 16, name: "Animación" },
  { id: 35, name: "Comedia" },
  { id: 80, name: "Crimen" },
  { id: 99, name: "Documental" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Familia" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Misterio" },
  { id: 10763, name: "Noticias" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10768, name: "Bélica & Política" },
  { id: 37, name: "Western" },
];
