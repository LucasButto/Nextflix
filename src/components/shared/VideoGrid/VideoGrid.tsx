"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import type { Video } from "@/types/tmdb";
import "./VideoGrid.scss";

interface VideoGridProps {
  videos: Video[];
  title: string;
}

const TYPE_LABELS: Record<string, string> = {
  Trailer: "Trailer",
  Teaser: "Teaser",
  Clip: "Clip",
  Featurette: "Featurette",
  "Behind the Scenes": "Behind the Scenes",
  Bloopers: "Bloopers",
  "Opening Credits": "Opening Credits",
};

export default function VideoGrid({ videos, title }: VideoGridProps) {
  const t = useTranslations("carousel");
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [videos]);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (videos.length === 0) return null;

  return (
    <div className="video-grid">
      <h3 className="section-title">{title}</h3>
      <div className="video-grid__wrapper">
        {canScrollLeft && (
          <button
            className="video-grid__arrow video-grid__arrow--left"
            onClick={() => scroll("left")}
            aria-label={t("prev")}
          >
            <ArrowBackIosRoundedIcon />
          </button>
        )}
        <div className="video-grid__track" ref={trackRef}>
          {videos.map((video) => {
            const isPlaying = playingKey === video.key;

            return (
              <div key={video.id} className="video-grid__card">
                <div className="video-grid__player">
                  {isPlaying ? (
                    <>
                      <iframe
                        className="video-grid__iframe"
                        src={`https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0&modestbranding=1`}
                        title={video.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <button
                        className="video-grid__close"
                        onClick={() => setPlayingKey(null)}
                        aria-label="Cerrar"
                      >
                        <CloseRoundedIcon />
                      </button>
                    </>
                  ) : (
                    <button
                      className="video-grid__thumb"
                      onClick={() => setPlayingKey(video.key)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                        alt={video.name}
                        className="video-grid__thumb-img"
                        loading="lazy"
                      />
                      <div className="video-grid__overlay">
                        <span className="video-grid__play-btn">
                          <PlayArrowRoundedIcon />
                        </span>
                      </div>
                    </button>
                  )}
                </div>
                <p className="video-grid__name">{video.name}</p>
                {video.type && (
                  <span className="video-grid__type">
                    {TYPE_LABELS[video.type] ?? video.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {canScrollRight && (
          <button
            className="video-grid__arrow video-grid__arrow--right"
            onClick={() => scroll("right")}
            aria-label={t("next")}
          >
            <ArrowForwardIosRoundedIcon />
          </button>
        )}
      </div>
    </div>
  );
}
