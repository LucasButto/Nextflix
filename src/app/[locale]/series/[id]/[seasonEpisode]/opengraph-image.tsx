import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getEpisodeDetails, getSeriesDetails } from "@/services/series";
import { backdropUrl, IMG_BASE } from "@/services/tmdb";
import type { EpisodeDetails, SeriesDetails } from "@/types/tmdb";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = readFileSync(join(process.cwd(), "public/Logo.png"));
const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

interface EpisodeOgParams {
  id: string;
  seasonEpisode: string;
  locale: string;
}

/**
 * Parsea "SxE" / "SxEE" (ej: "1x8", "12x08") a números.
 * Mismo formato que la página de detalle del episodio.
 */
function parseSeasonEpisode(
  slug: string,
): { season: number; episode: number } | null {
  const match = /^(\d+)[xX](\d+)$/.exec(slug);
  if (!match) return null;
  const season = Number(match[1]);
  const episode = Number(match[2]);
  if (!Number.isFinite(season) || !Number.isFinite(episode)) return null;
  if (season < 0 || episode < 1) return null;
  return { season, episode };
}

/**
 * Formatea una fecha "YYYY-MM-DD" a un label localizado.
 * Implementación inline en vez de importar utils para evitar acoplar el
 * runtime nodejs de @vercel/og a más dependencias del bundle de la app.
 */
function formatDate(dateStr: string, locale: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const intlLocale = locale === "en" ? "en-US" : "es-AR";
  return date.toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function Image({
  params,
}: {
  params: Promise<EpisodeOgParams>;
}) {
  const { id, seasonEpisode, locale } = await params;
  const isEn = locale === "en";
  const tmdbLang = isEn ? "en-US" : "es-MX";

  const parsed = parseSeasonEpisode(seasonEpisode);

  let series: SeriesDetails | null = null;
  let episode: EpisodeDetails | null = null;

  if (parsed) {
    try {
      [series, episode] = await Promise.all([
        getSeriesDetails(id, tmdbLang) as Promise<SeriesDetails>,
        getEpisodeDetails(id, parsed.season, parsed.episode, tmdbLang),
      ]);
    } catch {}
  }

  const seriesName = series?.name ?? "Nextflix";
  const episodeName = episode?.name ?? "";
  const seasonPrefix = isEn ? "S" : "T";
  const epCode = parsed
    ? `${seasonPrefix}${parsed.season}E${parsed.episode}`
    : "";
  const overview = episode?.overview
    ? episode.overview.slice(0, 180) +
      (episode.overview.length > 180 ? "…" : "")
    : "";
  const rating = episode?.vote_average ? episode.vote_average.toFixed(1) : null;
  const airDate = episode?.air_date
    ? formatDate(episode.air_date, locale)
    : null;
  const runtime = episode?.runtime ?? null;

  // Imagen de fondo: still del episodio si existe, fallback al backdrop de la
  // serie. Se usa el tamaño "w780" para el still (no hay helper directo, lo
  // armamos con IMG_BASE) y backdropUrl "md" para el de la serie.
  const heroSrc = episode?.still_path
    ? `${IMG_BASE}/w780${episode.still_path}`
    : series?.backdrop_path
      ? backdropUrl(series.backdrop_path, "md")!
      : null;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* Hero image (still o backdrop) ocupando todo el fondo */}
      {heroSrc && (
        <img
          src={heroSrc}
          alt="Episodio"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.4,
          }}
        />
      )}

      {/* Gradient izquierda → centro para legibilidad del texto */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.45) 80%, rgba(10,10,10,0.2) 100%)",
        }}
      />

      {/* Gradient inferior para asentar el logo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 35%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "52px 56px",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          gap: "14px",
        }}
      >
        {/* Kicker: nombre de la serie + epCode */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: "#7eb8f7",
              background: "rgba(126,184,247,0.12)",
              border: "1px solid rgba(126,184,247,0.35)",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "5px 11px",
              borderRadius: "6px",
            }}
          >
            {epCode}
          </span>
          <span
            style={{
              color: "#b3b3b3",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {seriesName}
          </span>
        </div>

        {/* Título del episodio */}
        <div
          style={{
            color: "#fff",
            fontSize:
              episodeName.length > 35
                ? "44px"
                : episodeName.length > 20
                  ? "54px"
                  : "62px",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
            maxWidth: "900px",
            display: "flex",
          }}
        >
          {episodeName}
        </div>

        {/* Meta: rating · fecha · runtime */}
        {(rating || airDate || runtime) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "2px",
            }}
          >
            {rating && (
              <span
                style={{
                  color: "#f5c518",
                  fontSize: "20px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                ⭐ {rating}
              </span>
            )}
            {airDate && (
              <span style={{ color: "#a3a3a3", fontSize: "18px" }}>
                {airDate}
              </span>
            )}
            {runtime && (
              <span style={{ color: "#a3a3a3", fontSize: "18px" }}>
                {runtime} min
              </span>
            )}
          </div>
        )}

        {/* Overview */}
        {overview && (
          <div
            style={{
              color: "#888",
              fontSize: "16px",
              lineHeight: 1.6,
              maxWidth: "780px",
              marginTop: "4px",
              display: "flex",
            }}
          >
            {overview}
          </div>
        )}

        {/* Logo Nextflix abajo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: "24px",
          }}
        >
          <img
            src={logoSrc}
            alt="Logo Nextflix"
            style={{
              height: "38px",
              width: "127px",
              objectFit: "contain",
              objectPosition: "left",
            }}
          />
        </div>
      </div>
    </div>,
    { ...size },
  );
}
