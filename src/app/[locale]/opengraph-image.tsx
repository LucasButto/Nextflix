import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = readFileSync(join(process.cwd(), "public/Logo.png"));
const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

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
        { icon: "🎬", label: "Movies" },
        { icon: "📺", label: "Series" },
        { icon: "⭐", label: "Top rated" },
        { icon: "🔥", label: "Trending" },
      ]
    : [
        { icon: "🎬", label: "Películas" },
        { icon: "📺", label: "Series" },
        { icon: "⭐", label: "Mejor valoradas" },
        { icon: "🔥", label: "En tendencia" },
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
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
