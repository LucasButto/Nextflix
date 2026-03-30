"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { backdropUrl } from "@/services/tmdb";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { useAuth } from "@/contexts/AuthContext";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import type { HeroBannerItem } from "@/types/tmdb";
import "./HeroBanner.scss";

interface HeroBannerProps {
  items: HeroBannerItem[];
}

export default function HeroBanner({ items = [] }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { isLoggedIn } = useAuth();

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning) return;
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(idx);
        setTransitioning(false);
      }, 400);
    },
    [transitioning],
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => goTo((current + 1) % items.length), 7000);
    return () => clearInterval(timer);
  }, [current, items.length, goTo]);

  if (!items.length)
    return <div className="hero-banner hero-banner--skeleton" />;

  const item = items[current];
  const title = "title" in item ? item.title : item.name;
  const overview = item.overview;
  const backdropPath = item.backdrop_path;
  const voteAverage = item.vote_average;
  const releaseDate =
    ("release_date" in item ? item.release_date : item.first_air_date) ?? "";
  const mediaType =
    item.media_type ?? ("first_air_date" in item ? "tv" : "movie");
  const href =
    mediaType === "tv" ? `/serie/${item.id}` : `/pelicula/${item.id}`;
  const inList = isInWatchlist(item.id, mediaType);

  return (
    <section className="hero-banner">
      <div
        className={`hero-banner__backdrop ${transitioning ? "hero-banner__backdrop--fade-out" : "hero-banner__backdrop--fade-in"}`}
      >
        {backdropUrl(backdropPath) && (
          <Image
            src={backdropUrl(backdropPath)!}
            alt={title}
            fill
            priority
            className="hero-banner__bg-image"
            sizes="100vw"
          />
        )}
        <div className="hero-banner__gradient-bottom" />
        <div className="hero-banner__gradient-left" />
      </div>

      <div className="hero-banner__content">
        <span className="hero-banner__badge">
          {mediaType === "tv" ? "📺 Serie" : "🎬 Película"} en Tendencia
        </span>
        <h1 className="hero-banner__title">{title}</h1>
        <p className="hero-banner__overview">{overview}</p>
        <div className="hero-banner__meta">
          {voteAverage > 0 && (
            <span className="hero-banner__rating">
              ⭐ {voteAverage.toFixed(1)}
            </span>
          )}
          <span className="hero-banner__year">{releaseDate.slice(0, 4)}</span>
        </div>
        <div className="hero-banner__actions">
          <Link href={href} className="hero-banner__btn-primary">
            <PlayArrowRoundedIcon /> Ver Detalles
          </Link>
          {isLoggedIn && (
            <button
              className={`hero-banner__btn-secondary ${inList ? "hero-banner__btn-secondary--active" : ""}`}
              onClick={() =>
                inList
                  ? removeFromWatchlist(item.id, mediaType)
                  : addToWatchlist({ ...item, media_type: mediaType })
              }
            >
              {inList ? "✓ En tu lista" : "+ Mi Lista"}
            </button>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="hero-banner__indicators">
          {items.map((_, i) => (
            <button
              key={i}
              className={`hero-banner__dot ${i === current ? "hero-banner__dot--active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
