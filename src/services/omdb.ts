// Servicio para obtener ratings reales de IMDb vía OMDb API (omdbapi.com).
//
// Se usa SOLO server-side: la key (OMDB_API_KEY) no es pública para no
// exponerla al cliente. Si no hay key, OMDb falla o se agota la cuota
// gratuita (1.000 req/día), las funciones devuelven null y el llamador hace
// fallback a los datos de TMDB normalizados.
//
// Para ahorrar requests:
//   - Solo se consulta al entrar al detalle de una serie (grid de episodios).
//   - Una request por temporada, cacheada 24h vía el fetch cache de Next.
//   - Si OMDb reporta límite alcanzado, se activa un cooldown para no
//     encadenar requests fallidas durante un rato.

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com";

interface OmdbEpisode {
  Episode: string; // "1"
  imdbRating: string; // "8.9" | "N/A"
  imdbID: string;
}

interface OmdbSeasonResponse {
  Response: "True" | "False";
  Error?: string;
  Episodes?: OmdbEpisode[];
}

// Cooldown ante cuota agotada / key inválida: evitamos seguir intentando por
// un rato, pero sin quedar bloqueados para siempre (cubre el reset diario).
const QUOTA_COOLDOWN_MS = 30 * 60 * 1000;
let quotaCooldownUntil = 0;

function inCooldown(): boolean {
  return Date.now() < quotaCooldownUntil;
}

function tripCooldown(): void {
  quotaCooldownUntil = Date.now() + QUOTA_COOLDOWN_MS;
}

/** OMDb está disponible si hay key configurada y no estamos en cooldown. */
export function isOmdbEnabled(): boolean {
  return Boolean(OMDB_API_KEY) && !inCooldown();
}

/**
 * Ratings de IMDb por episodio para una temporada concreta.
 *
 * @param imdbId  ID de IMDb de la serie (ej. "tt0944947")
 * @param seasonNumber  Número de temporada
 * @returns Map<episode_number, imdbRating> o null si no se pudo obtener
 *          (sin key, error, cuota agotada o sin episodios calificados).
 */
export async function getOmdbSeasonRatings(
  imdbId: string | null | undefined,
  seasonNumber: number,
): Promise<Map<number, number> | null> {
  if (!OMDB_API_KEY || !imdbId || inCooldown()) return null;

  const url = `${BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}&Season=${seasonNumber}`;

  try {
    // Cache 24h: los ratings de episodios cambian poco y así no gastamos
    // cuota en cada visita a la misma serie.
    const res = await fetch(url, {
      next: { revalidate: 86400 },
    } as RequestInit);

    if (!res.ok) {
      // 401 = key inválida o sin cuota → cooldown
      if (res.status === 401) tripCooldown();
      return null;
    }

    const data = (await res.json()) as OmdbSeasonResponse;

    if (data.Response !== "True" || !data.Episodes) {
      // Típicamente "Request limit reached!" cuando se agota la cuota diaria
      if (data.Error && /limit/i.test(data.Error)) tripCooldown();
      return null;
    }

    const map = new Map<number, number>();
    for (const ep of data.Episodes) {
      const epNum = Number(ep.Episode);
      const rating = Number(ep.imdbRating);
      if (Number.isFinite(epNum) && Number.isFinite(rating) && rating > 0) {
        map.set(epNum, rating);
      }
    }

    return map.size > 0 ? map : null;
  } catch {
    return null;
  }
}
