"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { useTranslations } from "next-intl";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { Movie, Series } from "@/types/tmdb";

type WatchlistButtonItem = Pick<
  Movie | Series,
  "id" | "poster_path" | "vote_average"
> & {
  title?: string;
  name?: string;
  media_type?: string;
};

interface WatchlistButtonProps {
  item: WatchlistButtonItem;
  mediaType: string;
}

export default function WatchlistButton({
  item,
  mediaType,
}: WatchlistButtonProps) {
  const t = useTranslations("watchlist");
  const { isLoggedIn } = useAuth();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [hovering, setHovering] = useState(false);

  if (!isLoggedIn) return null;

  const inList = isInWatchlist(item.id, mediaType);

  const handleClick = () => {
    if (inList) {
      removeFromWatchlist(item.id, mediaType);
    } else {
      addToWatchlist({
        id: item.id,
        media_type: mediaType,
        title: item.title ?? item.name ?? "",
        poster_path: item.poster_path,
        vote_average: item.vote_average,
      });
    }
  };

  const icon = inList ? (
    hovering ? <CloseRoundedIcon /> : <CheckRoundedIcon />
  ) : (
    <AddRoundedIcon />
  );

  const label = inList
    ? hovering
      ? t("remove")
      : t("inList")
    : t("add");

  return (
    <button
      className={`detail-btn-add ${inList ? "detail-btn-add--added" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {icon}
      {label}
    </button>
  );
}
