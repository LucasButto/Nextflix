"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWatched } from "@/contexts/WatchedContext";
import { useTranslations } from "next-intl";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import type { Movie, Series } from "@/types/tmdb";

type WatchedButtonItem = Pick<
  Movie | Series,
  "id" | "poster_path" | "vote_average"
> & {
  title?: string;
  name?: string;
  media_type?: string;
};

interface WatchedButtonProps {
  item: WatchedButtonItem;
  mediaType: string;
}

export default function WatchedButton({ item, mediaType }: WatchedButtonProps) {
  const t = useTranslations("watchlist");
  const { isLoggedIn } = useAuth();
  const { addToWatched, removeFromWatched, isWatched } = useWatched();
  const [hovering, setHovering] = useState(false);

  if (!isLoggedIn) return null;

  const seen = isWatched(item.id, mediaType);

  const handleClick = () => {
    if (seen) {
      removeFromWatched(item.id, mediaType);
    } else {
      addToWatched({
        id: item.id,
        media_type: mediaType,
        title: item.title ?? item.name ?? "",
        poster_path: item.poster_path,
        vote_average: item.vote_average,
      });
    }
  };

  const icon = seen ? (
    hovering ? <VisibilityOffRoundedIcon /> : <CheckRoundedIcon />
  ) : (
    <VisibilityRoundedIcon />
  );

  const label = seen
    ? hovering
      ? t("markUnwatched")
      : t("watched")
    : t("markWatched");

  return (
    <button
      className={`detail-btn-watched ${seen ? "detail-btn-watched--seen" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {icon}
      {label}
    </button>
  );
}
