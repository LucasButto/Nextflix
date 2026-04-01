"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { useWatched } from "@/contexts/WatchedContext";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/navigation";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { posterUrl } from "@/services/tmdb";
import { tmdbClientFetch } from "@/services/tmdb-client";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import QueuePlayNextRoundedIcon from "@mui/icons-material/QueuePlayNextRounded";
import LibraryAddCheckOutlinedIcon from "@mui/icons-material/LibraryAddCheckOutlined";
import "@/styles/pages/my-list/watchlist.scss";

const SKELETON_COUNT = 12;

// Datos actualizados desde TMDB para el locale actual
interface LocalizedItem {
  id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
}

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
  const t = useTranslations("myList");
  const locale = useLocale();
  const { isLoggedIn, isGuest } = useAuth();
  const {
    watchlist,
    loaded: watchlistLoaded,
    removeFromWatchlist,
  } = useWatchlist();
  const { watched, loaded: watchedLoaded, removeFromWatched } = useWatched();
  const [activeTab, setActiveTab] = useState<"lista" | "vistas">("lista");

  // Mapa de datos actualizados: `${media_type}-${id}` → LocalizedItem
  const [localizedData, setLocalizedData] = useState<
    Map<string, LocalizedItem>
  >(new Map());

  // Re-fetchear títulos y posters en el locale actual
  useEffect(() => {
    if (!watchlistLoaded || !watchedLoaded) return;

    const allItems = [...watchlist, ...watched].filter(
      (item, idx, arr) =>
        arr.findIndex(
          (x) => x.id === item.id && x.media_type === item.media_type,
        ) === idx,
    );

    if (allItems.length === 0) return;

    Promise.all(
      allItems.map(async (item) => {
        try {
          const endpoint =
            item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;
          const data = await tmdbClientFetch<{
            id: number;
            title?: string;
            name?: string;
            poster_path: string | null;
          }>(endpoint, locale);
          return {
            key: `${item.media_type}-${item.id}`,
            value: {
              id: item.id,
              media_type: item.media_type,
              title: data.title ?? data.name ?? item.title,
              poster_path: data.poster_path ?? item.poster_path,
            },
          };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      const map = new Map<string, LocalizedItem>();
      results.forEach((r) => {
        if (r) map.set(r.key, r.value);
      });
      setLocalizedData(map);
    });
  }, [watchlistLoaded, watchedLoaded, locale]); // re-fetch si cambia el locale

  if (!isLoggedIn && !isGuest) {
    return (
      <div className="watchlist-empty">
        <h2>{t("loginTitle")}</h2>
        <p>{t("loginSub")}</p>
      </div>
    );
  }

  if (!watchlistLoaded || !watchedLoaded) return <WatchlistSkeleton />;

  const activeItems = activeTab === "lista" ? watchlist : watched;

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h1 className="section-title">
          {activeTab === "lista" ? t("headingList") : t("headingWatched")}
        </h1>
        {activeItems.length > 0 && (
          <span className="watchlist-count">
            {t("titles", { count: activeItems.length })}
          </span>
        )}
      </div>

      <div className="watchlist-tabs">
        <button
          className={`watchlist-tab ${activeTab === "lista" ? "watchlist-tab--active" : ""}`}
          onClick={() => setActiveTab("lista")}
        >
          <QueuePlayNextRoundedIcon />
          {t("tabMyList")}
          {watchlist.length > 0 && (
            <span className="watchlist-tab__badge">{watchlist.length}</span>
          )}
        </button>
        <button
          className={`watchlist-tab ${activeTab === "vistas" ? "watchlist-tab--active" : ""}`}
          onClick={() => setActiveTab("vistas")}
        >
          <LibraryAddCheckOutlinedIcon />
          {t("tabWatched")}
          {watched.length > 0 && (
            <span className="watchlist-tab__badge">{watched.length}</span>
          )}
        </button>
      </div>

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
              ? t("emptyListTitle")
              : t("emptyWatchedTitle")}
          </h2>
          <p>
            {activeTab === "lista" ? t("emptyListSub") : t("emptyWatchedSub")}
          </p>
          <Link href="/" className="watchlist-browse-btn">
            {t("explore")}
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {activeItems.map((item, index) => {
            const href =
              item.media_type === "tv"
                ? `/series/${item.id}`
                : `/movies/${item.id}`;
            const key = `${item.media_type}-${item.id}`;
            const localized = localizedData.get(key);
            const displayTitle = localized?.title ?? item.title;
            const displayPoster = localized?.poster_path ?? item.poster_path;
            const onRemove =
              activeTab === "lista"
                ? () => removeFromWatchlist(item.id, item.media_type)
                : () => removeFromWatched(item.id, item.media_type);

            return (
              <div
                key={`${activeTab}-${item.media_type}-${item.id}`}
                className="watchlist-card"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <Link href={href} className="watchlist-card__poster-link">
                  <FadeImage
                    src={posterUrl(displayPoster, "md")}
                    alt={displayTitle}
                    width={200}
                    height={300}
                    className="watchlist-card__poster"
                    loading="lazy"
                  />
                  <div className="watchlist-card__overlay">
                    <span className="watchlist-card__type">
                      {item.media_type === "tv" ? t("series") : t("movie")}
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
                    {displayTitle}
                  </Link>
                  <button onClick={onRemove} className="watchlist-card__remove">
                    <DeleteForeverRoundedIcon className="watchlist-card__remove-icon" />
                    {t("removeItem")}
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
