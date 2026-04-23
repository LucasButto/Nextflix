"use client";
import { useState, useEffect, useCallback } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { IMG_BASE } from "@/services/tmdb";
import type { EpisodeImage } from "@/types/tmdb";
import "./EpisodeStills.scss";

interface EpisodeStillsProps {
  stills: EpisodeImage[];
  episodeName: string;
}

export default function EpisodeStills({
  stills,
  episodeName,
}: EpisodeStillsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? null : (i - 1 + stills.length) % stills.length,
    );
  }, [stills.length]);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % stills.length));
  }, [stills.length]);

  // Soporte de teclado en el lightbox
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    // Bloquear scroll detrás del modal
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, prev, next]);

  if (stills.length === 0) return null;

  const active = openIndex !== null ? stills[openIndex] : null;

  return (
    <>
      <div className="episode-stills-grid">
        {stills.map((still, i) => (
          <button
            key={still.file_path}
            type="button"
            className="episode-stills-item"
            onClick={() => setOpenIndex(i)}
            aria-label={`${episodeName} — ${i + 1}`}
          >
            <img
              src={`${IMG_BASE}/w500${still.file_path}`}
              alt={`${episodeName} — ${i + 1}`}
              loading="lazy"
              className="episode-stills-img"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="episode-stills-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={episodeName}
          onClick={close}
        >
          <button
            type="button"
            className="episode-stills-lightbox__close"
            onClick={close}
            aria-label="Close"
          >
            <CloseRoundedIcon />
          </button>
          {stills.length > 1 && (
            <button
              type="button"
              className="episode-stills-lightbox__arrow episode-stills-lightbox__arrow--left"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous"
            >
              <ArrowBackIosRoundedIcon />
            </button>
          )}
          <img
            src={`${IMG_BASE}/original${active.file_path}`}
            alt={episodeName}
            className="episode-stills-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          {stills.length > 1 && (
            <button
              type="button"
              className="episode-stills-lightbox__arrow episode-stills-lightbox__arrow--right"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next"
            >
              <ArrowForwardIosRoundedIcon />
            </button>
          )}
        </div>
      )}
    </>
  );
}
