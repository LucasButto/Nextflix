"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import "./TrailerPlayer.scss";

interface TrailerPlayerProps {
  videoKey: string;
  title: string;
}

export default function TrailerPlayer({ videoKey, title }: TrailerPlayerProps) {
  const t = useTranslations("trailer");
  const [playing, setPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoKey}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="trailer">
      <div className="trailer__wrapper">
        {playing ? (
          <iframe
            className="trailer__iframe"
            src={embedUrl}
            title={`Trailer: ${title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            className="trailer__thumbnail"
            onClick={() => setPlaying(true)}
            aria-label={t("play", { title })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="trailer__thumb-img"
            />
            <div className="trailer__overlay">
              <span className="trailer__play-btn">
                <PlayArrowRoundedIcon />
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
