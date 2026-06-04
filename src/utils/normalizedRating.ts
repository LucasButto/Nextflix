const SLOPE = 1.035;
const INTERCEPT = -0.094;

// Umbral debajo del cual NO aplicamos la fórmula: con pocos votos TMDB
// es ruidoso y la transformación amplificaría ese ruido.
const MIN_VOTE_COUNT = 20;

/**
 * Normaliza un rating de TMDB hacia escala IMDB.
 *
 * @param rating  Rating original de TMDB (0-10)
 * @param voteCount  Votos. Si < MIN_VOTE_COUNT, retorna el rating original.
 * @returns Rating normalizado, redondeado a 1 decimal, clampeado a [0, 10]
 */
export function normalizeRating(rating: number, voteCount?: number): number {
  if (!Number.isFinite(rating) || rating <= 0) return 0;

  // Sample size insuficiente: devolvemos el original redondeado
  if (voteCount !== undefined && voteCount < MIN_VOTE_COUNT) {
    return Math.round(rating * 10) / 10;
  }

  const adjusted = SLOPE * rating + INTERCEPT;
  const clamped = Math.max(0, Math.min(10, adjusted));
  return Math.round(clamped * 10) / 10;
}

export function normalizeTmdbResponse<T>(data: T): T {
  return walk(data) as T;
}

function walk(node: unknown): unknown {
  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(walk);
  }

  const obj = node as Record<string, unknown>;
  const voteCount =
    typeof obj.vote_count === "number" ? obj.vote_count : undefined;
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === "vote_average" && typeof value === "number") {
      out[key] = normalizeRating(value, voteCount);
    } else {
      out[key] = walk(value);
    }
  }
  return out;
}
