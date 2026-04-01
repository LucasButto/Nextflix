"use client";
import Link from "next/link";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { posterUrl } from "@/services/tmdb";
import { extractYear } from "@/utils/dates";
import type { Movie, Series } from "@/types/tmdb";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import "./MediaCard.scss";

type MediaItem = Movie | Series;

interface MediaCardProps {
  item: MediaItem;
  mediaType?: string;
  rank?: number;
  variant?: "default" | "top10" | "wide";
  smallRank?: boolean;
}

export default function MediaCard({
  item,
  mediaType,
  rank,
  variant = "default",
  smallRank = false,
}: MediaCardProps) {
  const type =
    mediaType ??
    ("media_type" in item ? item.media_type : undefined) ??
    "movie";
  const href = type === "tv" ? `/serie/${item.id}` : `/pelicula/${item.id}`;
  const title = "title" in item ? item.title : item.name;
  const releaseDate =
    "release_date" in item ? item.release_date : item.first_air_date;
  const year = extractYear(releaseDate);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const posterPath = item.poster_path;
  const backdropPath = "backdrop_path" in item ? item.backdrop_path : null;

  if (variant === "top10") {
    return (
      <Link href={href} className="media-card-top10">
        <span
          className={`media-card-top10__rank${smallRank ? " media-card-top10__rank--sm" : ""}`}
        >
          {rank}
        </span>
        <div className="media-card-top10__poster">
          <FadeImage
            src={posterUrl(posterPath, smallRank ? "xs" : "sm")}
            alt={title}
            fill
            className="media-card__img"
            sizes="150px"
            loading="lazy"
          />
          <div className="media-card-top10__overlay">
            {rating && (
              <span className="media-card-top10__rating">
                <StarRateRoundedIcon /> {rating}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`media-card ${variant === "wide" ? "media-card--wide" : ""}`}
    >
      <div className="media-card__poster-wrap">
        <FadeImage
          src={
            variant === "wide"
              ? backdropPath
                ? posterUrl(backdropPath, "md")
                : posterUrl(posterPath, "md")
              : posterUrl(posterPath, "sm")
          }
          alt={title}
          width={variant === "wide" ? 400 : 220}
          height={variant === "wide" ? 225 : 330}
          className="media-card__img"
          sizes={
            variant === "wide"
              ? "(max-width: 768px) 50vw, 400px"
              : "(max-width: 480px) 40vw, (max-width: 1024px) 22vw, 220px"
          }
          loading="lazy"
        />
        <div className="media-card__overlay">
          <div className="media-card__meta">
            {rating && (
              <span className="media-card__rating">
                <StarRateRoundedIcon /> {rating}
              </span>
            )}
            {year && <span className="media-card__year">{year}</span>}
          </div>
          <p className="media-card__title">{title}</p>
        </div>
      </div>
    </Link>
  );
}
