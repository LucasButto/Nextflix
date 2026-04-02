import { cookies } from "next/headers";

/**
 * Reads the user's IANA timezone from the `user_tz` cookie.
 * Returns undefined on first visit (before the cookie is set).
 */
export async function getUserTimezone(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get("user_tz")?.value;
}
