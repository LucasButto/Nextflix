import type {
  StreamingProvider,
  MovieDetails,
  SeriesDetails,
} from "@/types/tmdb";
import { extractYear } from "./dates";

/**
 * Extracts the flatrate streaming providers for AR (fallback to US).
 * Works with both MovieDetails and SeriesDetails.
 */
export function getProviders(
  detail: MovieDetails | SeriesDetails,
): StreamingProvider[] {
  return (
    detail["watch/providers"]?.results?.AR?.flatrate ??
    detail["watch/providers"]?.results?.US?.flatrate ??
    []
  );
}

interface StatusInfo {
  label: string;
  color: string;
}

/**
 * Maps a TMDB series status to a Spanish label and display color.
 */
export function getSeriesStatusInfo(status: string): StatusInfo {
  const map: Record<string, StatusInfo> = {
    "Returning Series": { label: "En emisión", color: "#46d369" },
    Ended: { label: "Finalizada", color: "#b3b3b3" },
    Canceled: { label: "Cancelada", color: "#b3b3b3" },
  };
  return map[status] ?? { label: status, color: "#b3b3b3" };
}

/**
 * Builds the year display string for a series.
 * Examples: "2020", "2020–2024"
 */
export function getSeriesYearDisplay(
  firstAirDate: string | null | undefined,
  lastAirDate: string | null | undefined,
): string {
  const year = extractYear(firstAirDate);
  const lastYear = extractYear(lastAirDate);
  if (lastYear && lastYear !== year) return `${year}–${lastYear}`;
  return year;
}

/**
 * Extracts the best YouTube trailer key from a videos object.
 * Priority: official Trailer on YouTube > any Trailer on YouTube > null
 */
export function getTrailerKey(
  videos:
    | {
        results: {
          key: string;
          site: string;
          type: string;
          official: boolean;
        }[];
      }
    | undefined,
): string | null {
  const results = videos?.results ?? [];
  const ytTrailers = results.filter(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  if (ytTrailers.length === 0) return null;
  const official = ytTrailers.find((v) => v.official);
  return (official ?? ytTrailers[0]).key;
}
