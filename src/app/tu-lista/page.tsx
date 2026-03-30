"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/contexts/WatchlistContext";
import Link from "next/link";
import Image from "next/image";
import { posterUrl } from "@/services/tmdb";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import "./watchlist.scss";

export default function TuListaPage() {
  const { isLoggedIn, isGuest } = useAuth();
  const { watchlist, loaded, removeFromWatchlist } = useWatchlist();

  if (!isLoggedIn && !isGuest) {
    return (
      <div className="watchlist-empty">
        <h2>Iniciá sesión para ver tu lista</h2>
        <p>Guardá películas y series para verlas después.</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="watchlist-loading">
        <div className="watchlist-spinner" />
        <p>Cargando tu lista...</p>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="watchlist-empty">
        <div className="watchlist-empty__icon">📋</div>
        <h2>Tu lista está vacía</h2>
        <p>
          Explorá películas y series y agregalas a tu lista para verlas después.
        </p>
        <Link href="/" className="watchlist-browse-btn">
          Explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h1 className="section-title">Tu Lista</h1>
        <span className="watchlist-count">
          {watchlist.length} título{watchlist.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="watchlist-grid">
        {watchlist.map((item) => {
          const href =
            item.media_type === "tv"
              ? `/serie/${item.id}`
              : `/pelicula/${item.id}`;
          return (
            <div
              key={`${item.media_type}-${item.id}`}
              className="watchlist-card"
            >
              <Link href={href} className="watchlist-card__poster-link">
                <Image
                  src={posterUrl(item.poster_path, "md")}
                  alt={item.title}
                  width={200}
                  height={300}
                  className="watchlist-card__poster"
                />
                <div className="watchlist-card__overlay">
                  <span className="watchlist-card__type">
                    {item.media_type === "tv" ? "📺 Serie" : "🎬 Película"}
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
                <button
                  className="watchlist-card__remove"
                  onClick={() => removeFromWatchlist(item.id, item.media_type)}
                >
                  <DeleteForeverRoundedIcon className="watchlist-card__remove-icon" />{" "}
                  Quitar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
