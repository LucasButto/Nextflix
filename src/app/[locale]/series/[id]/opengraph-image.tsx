import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getSeriesDetails } from "@/services/series";
import { backdropUrl, posterUrl, IMG_BASE } from "@/services/tmdb";
import { getProviders } from "@/utils/media";
import type { SeriesDetails, StreamingProvider } from "@/types/tmdb";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

  let series: SeriesDetails | null = null;
  try {
    series = (await getSeriesDetails(id, tmdbLang)) as SeriesDetails;
  } catch {}

  const title = series?.name ?? "Nextflix";
  const tagline = series?.tagline ?? "";
  const overview = series?.overview
    ? series.overview.slice(0, 400) + (series.overview.length > 400 ? "…" : "")
    : "";
  const rating = series?.vote_average ? series.vote_average.toFixed(1) : null;
  const year = series?.first_air_date?.slice(0, 4) ?? null;
  const seasons = series?.number_of_seasons ?? null;
  const backdropSrc = series?.backdrop_path
    ? backdropUrl(series.backdrop_path, "md")!
    : null;
  const posterSrc = series?.poster_path
    ? posterUrl(series.poster_path, "md")
    : null;

  const providers: StreamingProvider[] = series
    ? getProviders(series).slice(0, 5)
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(10,10,10,1) 30%, rgba(10,10,10,0.65) 65%, rgba(10,10,10,0.3) 100%)",
        }}
      />

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
          {/* Badge + year + rating + seasons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                background: "#7c3aed",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              {isEn ? "Series" : "Serie"}
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
            {seasons && (
              <span style={{ color: "#737373", fontSize: "16px" }}>
                {seasons}{" "}
                {isEn
                  ? seasons === 1
                    ? "season"
                    : "seasons"
                  : seasons === 1
                    ? "temporada"
                    : "temporadas"}
              </span>
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
