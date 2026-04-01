"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { useWatched } from "@/contexts/WatchedContext";
import Link from "next/link";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { posterUrl } from "@/services/tmdb";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import QueuePlayNextRoundedIcon from "@mui/icons-material/QueuePlayNextRounded";
import LibraryAddCheckOutlinedIcon from "@mui/icons-material/LibraryAddCheckOutlined";
import "./watchlist.scss";

const SKELETON_COUNT = 12;

function WatchlistSkeleton() {
  return (
    <div className="sk-watchlist">
      <div className="sk-watchlist__header">
        <div className="sk-watchlist__title" />
        <div className="sk-watchlist__count" />
      </div>
      <div className="sk-watchlist__grid">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i}>
            <div className="sk-watchlist__card-img" />
            <div className="sk-watchlist__card-title" />
            <div className="sk-watchlist__card-sub" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TuListaPage() {
  const { isLoggedIn, isGuest } = useAuth();
  const {
    watchlist,
    loaded: watchlistLoaded,
    removeFromWatchlist,
  } = useWatchlist();
  const { watched, loaded: watchedLoaded, removeFromWatched } = useWatched();
  const [activeTab, setActiveTab] = useState<"lista" | "vistas">("lista");

  if (!isLoggedIn && !isGuest) {
    return (
      <div className="watchlist-empty">
        <h2>Iniciá sesión para ver tu lista</h2>
        <p>Guardá películas y series para verlas después.</p>
      </div>
    );
  }

  if (!watchlistLoaded || !watchedLoaded) {
    return <WatchlistSkeleton />;
  }

  const activeItems = activeTab === "lista" ? watchlist : watched;

  return (
    <div className="watchlist-page">
      {/* ── Header ── */}
      <div className="watchlist-header">
        <h1 className="section-title">
          {activeTab === "lista" ? "Tu Lista" : "Ya vistas"}
        </h1>
        {activeItems.length > 0 && (
          <span className="watchlist-count">
            {activeItems.length} título{activeItems.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="watchlist-tabs">
        <button
          className={`watchlist-tab ${activeTab === "lista" ? "watchlist-tab--active" : ""}`}
          onClick={() => setActiveTab("lista")}
        >
          <QueuePlayNextRoundedIcon />
          Mi Lista
          {watchlist.length > 0 && (
            <span className="watchlist-tab__badge">{watchlist.length}</span>
          )}
        </button>
        <button
          className={`watchlist-tab ${activeTab === "vistas" ? "watchlist-tab--active" : ""}`}
          onClick={() => setActiveTab("vistas")}
        >
          <LibraryAddCheckOutlinedIcon />
          Ya vistas
          {watched.length > 0 && (
            <span className="watchlist-tab__badge">{watched.length}</span>
          )}
        </button>
      </div>

      {/* ── Empty state ── */}
      {activeItems.length === 0 ? (
        <div className="watchlist-empty watchlist-empty--inline">
          <div className="watchlist-empty__icon">
            {activeTab === "lista" ? (
              <QueuePlayNextRoundedIcon />
            ) : (
              <LibraryAddCheckOutlinedIcon />
            )}
          </div>
          <h2>
            {activeTab === "lista"
              ? "Tu lista está vacía"
              : "Todavía no marcaste nada como visto"}
          </h2>
          <p>
            {activeTab === "lista"
              ? "Explorá películas y series y agregalas a tu lista para verlas después."
              : "Cuando termines de ver algo, marcalo como visto desde la página de la película o serie."}
          </p>
          <Link href="/" className="watchlist-browse-btn">
            Explorar
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {activeItems.map((item, index) => {
            const href =
              item.media_type === "tv"
                ? `/serie/${item.id}`
                : `/pelicula/${item.id}`;
            const onRemove =
              activeTab === "lista"
                ? () => removeFromWatchlist(item.id, item.media_type)
                : () => removeFromWatched(item.id, item.media_type);

            return (
              <div
                // ✅ activeTab en el key fuerza el remount de cada card al
                // cambiar de tab, garantizando que:
                // 1. La animación fadeInUp se re-ejecuta en todas las cards.
                // 2. FadeImage arranca como instancia nueva y muestra el
                //    poster correcto (evita que React reutilice el nodo con
                //    la imagen del tab anterior).
                key={`${activeTab}-${item.media_type}-${item.id}`}
                className="watchlist-card"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <Link href={href} className="watchlist-card__poster-link">
                  <FadeImage
                    src={posterUrl(item.poster_path, "md")}
                    alt={item.title}
                    width={200}
                    height={300}
                    className="watchlist-card__poster"
                    loading="lazy"
                  />
                  <div className="watchlist-card__overlay">
                    <span className="watchlist-card__type">
                      {item.media_type === "tv" ? "Serie" : "Película"}
                    </span>
                    {item.vote_average > 0 && (
                      <span className="watchlist-card__rating">
                        ⭐ {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="watchlist-card__info">
                  <Link href={href} className="watchlist-card__title">
                    {item.title}
                  </Link>
                  <button onClick={onRemove} className="watchlist-card__remove">
                    <DeleteForeverRoundedIcon className="watchlist-card__remove-icon" />
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
