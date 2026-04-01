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

/**
 * Extracts the content certification (age rating) for a movie or series.
 * Priority: AR → US → GB → first available
 */
export function getCertification(
  detail: MovieDetails | SeriesDetails,
): string | null {
  const PRIORITY = ["AR", "US", "GB"];

  if ("release_dates" in detail && detail.release_dates) {
    // Movie: buscar en release_dates
    const results = detail.release_dates.results ?? [];
    for (const region of PRIORITY) {
      const regionData = results.find((r) => r.iso_3166_1 === region);
      const cert = regionData?.release_dates
        .filter((rd) => rd.certification)
        .sort((a, b) => b.type - a.type) // type 3 = theatrical, mayor prioridad
        .find((rd) => rd.certification)?.certification;
      if (cert) return cert;
    }
    // Fallback: primer cert disponible
    for (const region of results) {
      const cert = region.release_dates.find(
        (rd) => rd.certification,
      )?.certification;
      if (cert) return cert;
    }
  }

  if ("content_ratings" in detail && detail.content_ratings) {
    // Series: buscar en content_ratings
    const results = detail.content_ratings.results ?? [];
    for (const region of PRIORITY) {
      const rating = results.find((r) => r.iso_3166_1 === region)?.rating;
      if (rating) return rating;
    }
    // Fallback: primer rating disponible
    const first = results.find((r) => r.rating);
    if (first) return first.rating;
  }

  return null;
}
