/** Reel animation tuning */
export const REEL_ITEM_HEIGHT = 60;
export const REEL_STRIP_LENGTH = 50;
export const REEL_WINNER_INDEX = 46;
export const REEL_SPIN_DURATION_MS = 3600;

/** Country priority for the country selector (LATAM first) */
export const COUNTRY_PRIORITY: Record<string, number> = {
  AR: 1,
  MX: 2,
  CO: 3,
  CL: 4,
  PE: 5,
  UY: 6,
  EC: 7,
  BO: 8,
  PY: 9,
  VE: 10,
  ES: 11,
  US: 12,
  GB: 13,
  CA: 14,
  AU: 15,
  BR: 16,
  FR: 17,
  DE: 18,
  IT: 19,
  JP: 20,
  PT: 21,
  NL: 22,
  BE: 23,
  CH: 24,
  AT: 25,
  PL: 26,
  SE: 27,
  NO: 28,
  DK: 29,
  FI: 30,
};

/** Popular streaming provider IDs (TMDB) */
export const POPULAR_PROVIDER_IDS = new Set([
  8, // Netflix
  1796, // Netflix
  9, // Amazon Prime Video
  119, // Amazon Prime Video
  337, // Disney Plus
  350, // Apple TV Plus
  384, // HBO Max / Max
  1899, // HBO Max / Max
  531, // Paramount Plus
  619, // Star Plus
]);
