import type {
  StreamingProvider,
  MovieDetails,
  SeriesDetails,
} from "@/types/tmdb";
import { extractYear } from "./dates";

/**
 * Maps known TMDB provider IDs to their homepage URLs.
 * Covers the most common platforms in AR/LATAM/US.
 */
const PROVIDER_HOMEPAGES: Record<number, string> = {
  // Global
  8: "https://www.netflix.com", // Netflix
  9: "https://www.primevideo.com", // Amazon Prime Video
  119: "https://www.primevideo.com", // Amazon Prime Video (AR)
  337: "https://www.disneyplus.com", // Disney Plus
  350: "https://tv.apple.com", // Apple TV Plus
  384: "https://www.max.com", // HBO Max / Max
  1899: "https://www.max.com", // Max
  531: "https://www.paramountplus.com", // Paramount Plus
  283: "https://www.crunchyroll.com", // Crunchyroll
  2: "https://tv.apple.com", // Apple TV
  3: "https://play.google.com/store/movies", // Google Play Movies
  192: "https://www.youtube.com", // YouTube
  15: "https://www.hulu.com", // Hulu
  386: "https://www.peacocktv.com", // Peacock
  387: "https://www.peacocktv.com", // Peacock Premium
  // LATAM / AR
  339: "https://www.movistarplay.com.ar", // Movistar Play
  619: "https://www.starplus.com", // Star Plus
  11: "https://mubi.com", // MUBI
  307: "https://globoplay.globo.com", // Globoplay
  31: "https://www.hbo.com", // HBO Go
  1796: "https://www.netflix.com", // Netflix basic with Ads
  1825: "https://www.max.com", // Max Amazon Channel
  1853: "https://www.max.com", // Max Apple TV Channel
};

/**
 * Returns the homepage URL for a streaming provider, or null if unknown.
 */
export function getProviderHomepage(providerId: number): string | null {
  return PROVIDER_HOMEPAGES[providerId] ?? null;
}

/**
 * Extracts the flatrate streaming providers, watch link, and provider homepages
 * for AR (fallback to US). Works with both MovieDetails and SeriesDetails.
 */
export function getProviders(detail: MovieDetails | SeriesDetails): {
  providers: StreamingProvider[];
  link: string | null;
} {
  const region =
    detail["watch/providers"]?.results?.AR ??
    detail["watch/providers"]?.results?.US ??
    null;
  return {
    providers: region?.flatrate ?? [],
    link: region?.link ?? null,
  };
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
