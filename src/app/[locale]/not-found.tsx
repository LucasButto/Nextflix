import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center" as const,
        padding: "2rem",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "4rem" }}>🎬</span>
      <h1
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "3rem",
          letterSpacing: "2px",
        }}
      >
        {t("title")}
      </h1>
      <p style={{ color: "#b3b3b3", maxWidth: "360px" }}>{t("subtitle")}</p>
      <Link
        href="/"
        style={{
          marginTop: "1rem",
          padding: "12px 32px",
          background: "#a855f7",
          borderRadius: "8px",
          fontWeight: "700",
          fontSize: "0.9rem",
        }}
      >
        {t("back")}
      </Link>
    </div>
  );
}
