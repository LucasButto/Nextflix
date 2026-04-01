import type { Episode } from "@/types/tmdb";

/**
 * Formats a runtime in minutes into a human-readable string.
 * Examples: 142 → "2h 22min", 45 → "45min", 120 → "2h"
 */
export function formatRuntime(minutes: number): string {
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}min`);
  return parts.join(" ");
}

/**
 * Returns "T2 E5" style label from an Episode object.
 */
export function formatEpCode(ep: Episode): string {
  return `T${ep.season_number} E${ep.episode_number}`;
}
