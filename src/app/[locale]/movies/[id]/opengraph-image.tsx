import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getMovieDetails } from "@/services/movies";
import { backdropUrl, posterUrl, IMG_BASE } from "@/services/tmdb";
import { getProviders } from "@/utils/media";
import type { MovieDetails, StreamingProvider } from "@/types/tmdb";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Cacheado a nivel de módulo — se lee una sola vez
const logoData = readFileSync(join(process.cwd(), "public/Logo.png"));
const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const isEn = locale === "en";
  const tmdbLang = isEn ? "en-US" : "es-419";

  let movie: MovieDetails | null = null;
  try {
    movie = (await getMovieDetails(id, tmdbLang)) as MovieDetails;
  } catch {}

  const title = movie?.title ?? "Nextflix";
  const tagline = movie?.tagline ?? "";
  const overview = movie?.overview
    ? movie.overview.slice(0, 400) + (movie.overview.length > 400 ? "…" : "")
    : "";
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : null;
  const year = movie?.release_date?.slice(0, 4) ?? null;
  const backdropSrc = movie?.backdrop_path
    ? backdropUrl(movie.backdrop_path, "md")!
    : null;
  const posterSrc = movie?.poster_path
    ? posterUrl(movie.poster_path, "md")
    : null;

  const providers: StreamingProvider[] = movie
    ? getProviders(movie).slice(0, 5)
    : [];

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
      {/* Backdrop */}
      {backdropSrc && (
        <img
          src={backdropSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.28,
          }}
        />
      )}
      {/* Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(10,10,10,1) 30%, rgba(10,10,10,0.65) 65%, rgba(10,10,10,0.3) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "40px 52px",
          gap: "44px",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Poster */}
        {posterSrc && (
          <img
            src={posterSrc}
            style={{
              width: "186px",
              height: "279px",
              objectFit: "cover",
              borderRadius: "12px",
              flexShrink: 0,
              boxShadow: "0 16px 48px rgba(0,0,0,0.85)",
            }}
          />
        )}

        {/* Info column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            minWidth: 0,
            height: "100%",
            justifyContent: "center",
          }}
        >
          {/* Badge + year + rating */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                background: "#e50914",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              {isEn ? "Movie" : "Película"}
            </span>
            {rating && (
              <span
                style={{
                  color: "#f5c518",
                  fontSize: "17px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ⭐ {rating}
              </span>
            )}
            {year && (
              <span style={{ color: "#737373", fontSize: "16px" }}>{year}</span>
            )}
          </div>

          {/* Title */}
          <div
            style={{
              color: "#fff",
              fontSize:
                title.length > 35
                  ? "40px"
                  : title.length > 20
                    ? "50px"
                    : "58px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </div>

          {/* Tagline */}
          {tagline && (
            <div
              style={{
                color: "#b3b3b3",
                fontSize: "17px",
                fontStyle: "italic",
                lineHeight: 1.3,
              }}
            >
              {tagline}
            </div>
          )}

          {/* Overview */}
          {overview && (
            <div
              style={{
                color: "#888",
                fontSize: "15px",
                lineHeight: 1.6,
                maxWidth: "640px",
              }}
            >
              {overview}
            </div>
          )}

          {/* Providers */}
          {providers.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              {providers.map((p) => (
                <img
                  key={p.provider_id}
                  src={`${IMG_BASE}/w45${p.logo_path}`}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "7px",
                    objectFit: "cover",
                  }}
                />
              ))}
            </div>
          )}

          {/* Logo */}
          <div
            style={{ display: "flex", alignItems: "center", paddingTop: "6px" }}
          >
            <img
              src={logoSrc}
              style={{
                height: "38px",
                width: "127px",
                objectFit: "contain",
                objectPosition: "left",
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
