// Versión client-safe de tmdbFetch para usar en componentes "use client".
// No importa next-intl/server — recibe el locale como parámetro explícito.

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const LOCALE_TO_TMDB_LANG: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tmdbClientFetch<T = any>(
  endpoint: string,
  locale: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const language = LOCALE_TO_TMDB_LANG[locale] ?? "es-MX";

  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY ?? "",
    language,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });

  const res = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json() as Promise<T>;
}
