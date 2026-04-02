"use client";

import { useEffect } from "react";

/**
 * Invisible client component that syncs the browser's IANA timezone
 * into a cookie so server components can compute "today" correctly
 * for the user's local time.
 */
export default function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Solo setear si cambió (evita escritura en cada render)
    if (!document.cookie.includes(`user_tz=${tz}`)) {
      document.cookie = `user_tz=${tz};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, []);

  return null;
}
