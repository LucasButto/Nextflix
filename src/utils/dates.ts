/**
 * Converts a TMDB date string ("YYYY-MM-DD") to "DD/MM/YYYY".
 * Uses noon UTC to avoid timezone shifts flipping the day.
 * Returns empty string for falsy or malformed input.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

/**
 * Formats a TMDB date string ("YYYY-MM-DD") into a localised Spanish
 * label with weekday and month name.
 * Uses noon UTC to avoid timezone shifts flipping the day.
 *
 * Output examples:
 *   - same year  → "martes, 1 de abril"
 *   - other year → "martes, 1 de abril de 2027"
 */
export function formatSpanishDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const now = new Date();

  const sameYear = date.getUTCFullYear() === now.getFullYear();

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

/**
 * Returns true if the date string is today or in the future.
 * Compares at UTC midnight so "today" counts as upcoming until the day ends.
 */
export function isUpcoming(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  // Comparar en tiempo local para respetar la zona horaria del servidor/usuario
  const release = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return release >= today;
}

/**
 * Extracts the 4-digit year from a TMDB date string ("YYYY-MM-DD").
 * Returns empty string for falsy input.
 */
export function extractYear(dateStr: string | null | undefined): string {
  return (dateStr ?? "").slice(0, 4);
}

/**
 * Calculates age from a birth date string. Returns null if no birth date
 * or if the person is deceased (deathday provided).
 */
export function calculateAge(
  birthday: string | null | undefined,
  deathday?: string | null,
): number | null {
  if (!birthday || deathday) return null;
  return Math.floor(
    new Date().getFullYear() - new Date(birthday + "T00:00:00").getFullYear(),
  );
}

/**
 * Returns true if the date string is exactly today (UTC).
 */
export function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  const now = new Date();
  return (
    year === now.getFullYear() &&
    month === now.getMonth() + 1 &&
    day === now.getDate()
  );
}
