const OMDB_BASE = "https://www.omdbapi.com";
const OMDB_KEY = process.env.OMDB_API_KEY;

// Cache de respuestas: 24 horas. Se revalida en background.
const REVALIDATE_SECONDS = 60 * 60 * 24;

const QUOTA_BACKOFF_MS = 60 * 60 * 1000;
let quotaExhaustedUntil: number | null = null;

function isQuotaExhausted(): boolean {
  return quotaExhaustedUntil !== null && Date.now() < quotaExhaustedUntil;
}

function markQuotaExhausted() {
  quotaExhaustedUntil = Date.now() + QUOTA_BACKOFF_MS;
}

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export interface OmdbRating {
  rating: number;
  votes: number;
}

export interface OmdbEpisodeRating {
  episode_number: number;
  rating: number;
  votes: number;
  imdbId: string | null;
}

// ─── Tipos internos de respuesta OMDb ────────────────────────────────────────

interface OmdbBaseResponse {
  Response: "True" | "False";
  Error?: string;
}

interface OmdbTitleResponse extends OmdbBaseResponse {
  imdbRating?: string;
  imdbVotes?: string;
}

interface OmdbSeasonEpisode {
  Title: string;
  Episode: string;
  imdbRating: string;
  imdbID: string;
  Released?: string;
}

interface OmdbSeasonResponse extends OmdbBaseResponse {
  Title?: string;
  Season?: string;
  totalSeasons?: string;
  Episodes?: OmdbSeasonEpisode[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRating(raw: string | undefined): number | null {
  if (!raw || raw === "N/A") return null;
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : null;
}

function parseVotes(raw: string | undefined): number {
  if (!raw || raw === "N/A") return 0;
  const cleaned = raw.replace(/,/g, "");
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : 0;
}

function isLimitError(error: string | undefined): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes("limit reached") ||
    lower.includes("request limit") ||
    lower.includes("daily limit") ||
    lower.includes("no api key")
  );
}

async function omdbFetch<T extends OmdbBaseResponse>(
  params: Record<string, string>,
): Promise<T | null> {
  if (!OMDB_KEY) return null;
  if (isQuotaExhausted()) return null;

  const queryParams = new URLSearchParams({
    apikey: OMDB_KEY,
    tomatoes: "false",
    ...params,
  });

  try {
    const res = await fetch(`${OMDB_BASE}/?${queryParams}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    // 401 = api key inválida o cuota agotada
    if (res.status === 401) {
      markQuotaExhausted();
      return null;
    }

    if (!res.ok) return null;

    const data = (await res.json()) as T;

    // OMDb devuelve 200 con Response="False" cuando hay error.
    if (data.Response === "False") {
      if (isLimitError(data.Error)) {
        markQuotaExhausted();
      }
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Trae el rating IMDb de una película o serie por su IMDb ID (tt0000000).
 * Devuelve null si OMDb no tiene datos, la cuota está agotada o no hay API key.
 */
export async function getOmdbRating(
  imdbId: string | null | undefined,
): Promise<OmdbRating | null> {
  if (!imdbId) return null;
  const data = await omdbFetch<OmdbTitleResponse>({ i: imdbId });
  if (!data) return null;
  const rating = parseRating(data.imdbRating);
  if (rating === null) return null;
  return { rating, votes: parseVotes(data.imdbVotes) };
}

/**
 * Trae los ratings IMDb de todos los episodios de una temporada en una sola llamada.
 */
export async function getOmdbSeasonRatings(
  seriesImdbId: string | null | undefined,
  seasonNumber: number,
): Promise<Map<number, OmdbEpisodeRating> | null> {
  if (!seriesImdbId) return null;
  const data = await omdbFetch<OmdbSeasonResponse>({
    i: seriesImdbId,
    Season: String(seasonNumber),
  });
  if (!data || !data.Episodes) return null;

  const map = new Map<number, OmdbEpisodeRating>();
  for (const ep of data.Episodes) {
    const epNum = parseInt(ep.Episode, 10);
    if (!Number.isFinite(epNum)) continue;
    const rating = parseRating(ep.imdbRating);
    if (rating === null) continue;
    map.set(epNum, {
      episode_number: epNum,
      rating,
      votes: 0,
      imdbId: ep.imdbID || null,
    });
  }
  return map;
}

/**
 * Helper para enriquecer un array de items (movies o series) con su rating
 * IMDb. Recibe una función que extrae el imdbId de cada item (puede requerir
 * una llamada adicional al detalle de TMDB, ver implementación en cada
 * service de movies/series).
 *
 * Procesa en lotes para no saturar OMDb con 100 llamadas concurrentes.
 */
export async function enrichWithOmdbRatings<T>(
  items: T[],
  getImdbId: (item: T) => Promise<string | null>,
  batchSize = 10,
): Promise<Array<T & { imdb_rating: number | null; imdb_votes: number }>> {
  const enriched: Array<
    T & { imdb_rating: number | null; imdb_votes: number }
  > = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (item) => {
        const imdbId = await getImdbId(item).catch(() => null);
        const omdb = await getOmdbRating(imdbId);
        return {
          ...item,
          imdb_rating: omdb?.rating ?? null,
          imdb_votes: omdb?.votes ?? 0,
        };
      }),
    );
    enriched.push(...results);
  }

  return enriched;
}

/**
 * Estado del circuit breaker.
 */
export function getOmdbStatus() {
  return {
    hasApiKey: !!OMDB_KEY,
    quotaExhausted: isQuotaExhausted(),
    quotaResetsAt: quotaExhaustedUntil,
  };
}
