import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = readFileSync(join(process.cwd(), "public/Logo.png"));
const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

/*
 * Iconos de las pills: paths del set Material Icons Rounded (los mismos que
 * usa @mui/icons-material) inlineados como SVG. Satori solo entiende
 * elementos <svg> planos, no componentes de React de MUI.
 */
const PILL_ICON = "#e0e0e0";

const movieIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={PILL_ICON}>
    <path d="m18 4 1.82 3.64c.08.16-.04.36-.22.36h-1.98c-.38 0-.73-.21-.89-.55L15 4h-2l1.82 3.64c.08.16-.04.36-.22.36h-1.98c-.38 0-.73-.21-.89-.55L10 4H8l1.82 3.64c.08.16-.04.36-.22.36H7.62c-.38 0-.73-.21-.9-.55L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-.55-.45-1-1-1z" />
  </svg>
);

const seriesIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={PILL_ICON}>
    <path d="m10.5 17.15 3.98-2.28c.67-.38.67-1.35 0-1.74l-3.98-2.28c-.67-.38-1.5.11-1.5.87v4.55c0 .77.83 1.26 1.5.88M21 6h-7.59l2.94-2.94c.2-.2.2-.51 0-.71s-.51-.2-.71 0L12 5.99 8.36 2.35c-.2-.2-.51-.2-.71 0s-.2.51 0 .71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2m-1 14H4c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1" />
  </svg>
);

const starIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={PILL_ICON}>
    <path d="m14.43 10-1.47-4.84c-.29-.95-1.63-.95-1.91 0L9.57 10H5.12c-.97 0-1.37 1.25-.58 1.81l3.64 2.6-1.43 4.61c-.29.93.79 1.68 1.56 1.09l3.69-2.8 3.69 2.81c.77.59 1.85-.16 1.56-1.09l-1.43-4.61 3.64-2.6c.79-.57.39-1.81-.58-1.81h-4.45z" />
  </svg>
);

const trendingIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={PILL_ICON}>
    <path d="M17.09 4.56c-.7-1.03-1.5-1.99-2.4-2.85-.35-.34-.94-.02-.84.46.19.94.39 2.18.39 3.29 0 2.06-1.35 3.73-3.41 3.73-1.54 0-2.8-.93-3.35-2.26-.1-.2-.14-.32-.2-.54-.11-.42-.66-.55-.9-.18-.18.27-.35.54-.51.83C4.68 9.08 4 11.46 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-3.49-1.08-6.73-2.91-9.44M11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.47-.3 2.98-.93 4.03-1.92.28-.26.74-.14.82.23.23 1.02.35 2.08.35 3.15.01 2.65-2.14 4.8-4.79 4.8" />
  </svg>
);

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  const tagline = isEn
    ? "Discover trending movies and series"
    : "Descubrí películas y series en tendencia";

  const pills = isEn
    ? [
        { icon: movieIcon, label: "Movies" },
        { icon: seriesIcon, label: "Series" },
        { icon: starIcon, label: "Top rated" },
        { icon: trendingIcon, label: "Trending" },
      ]
    : [
        { icon: movieIcon, label: "Películas" },
        { icon: seriesIcon, label: "Series" },
        { icon: starIcon, label: "Mejor valoradas" },
        { icon: trendingIcon, label: "En tendencia" },
      ];

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-160px",
          right: "-160px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(229,9,20,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "-120px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(to right, transparent, #e50914, transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(to right, transparent, #e50914, transparent)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
          padding: "0 80px",
        }}
      >
        <img
          src={logoSrc}
          style={{ height: "90px", width: "300px", objectFit: "contain" }}
        />
        <div
          style={{
            width: "60px",
            height: "3px",
            background: "#e50914",
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            color: "#b3b3b3",
            fontSize: "22px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          {pills.map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "40px",
                color: "#e0e0e0",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
