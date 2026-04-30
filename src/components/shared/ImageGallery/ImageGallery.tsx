"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import { IMG_BASE } from "@/services/tmdb";
import type { TmdbImage } from "@/types/tmdb";
import "./ImageGallery.scss";

const PAGE_SIZE = 12;

interface ImageGalleryProps {
  images: TmdbImage[];
  alt: string;
  aspectRatio?: "landscape" | "portrait";
}

function GalleryThumb({
  img,
  alt,
  index,
  onOpen,
}: {
  img: TmdbImage;
  alt: string;
  index: number;
  onOpen: (i: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      className="image-gallery__item"
      onClick={() => onOpen(index)}
      aria-label={`${alt} — ${index + 1}`}
    >
      {!loaded && <span className="image-gallery__shimmer" />}
      <img
        src={`${IMG_BASE}/w500${img.file_path}`}
        alt={`${alt} — ${index + 1}`}
        loading="lazy"
        className={`image-gallery__img ${loaded ? "image-gallery__img--visible" : ""}`}
        onLoad={() => setLoaded(true)}
      />
    </button>
  );
}

export default function ImageGallery({
  images,
  alt,
  aspectRatio = "landscape",
}: ImageGalleryProps) {
  const t = useTranslations("detail");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visibleImages = images.slice(0, visibleCount);
  const canShowMore = visibleCount < images.length;
  const canShowLess = visibleCount > PAGE_SIZE;
  const remaining = images.length - visibleCount;

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? null : (i - 1 + images.length) % images.length,
    );
  }, [images.length]);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, prev, next]);

  if (images.length === 0) return null;

  const active = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      <div
        className={`image-gallery__grid ${
          aspectRatio === "portrait" ? "image-gallery__grid--portrait" : ""
        }`}
      >
        {visibleImages.map((img, i) => (
          <GalleryThumb
            key={img.file_path}
            img={img}
            alt={alt}
            index={i}
            onOpen={setOpenIndex}
          />
        ))}
      </div>

      {(canShowMore || canShowLess) && (
        <div className="image-gallery__toggle-wrap">
          {canShowLess && (
            <button
              type="button"
              className="image-gallery__toggle image-gallery__toggle--less"
              onClick={() => setVisibleCount(PAGE_SIZE)}
            >
              <RemoveRoundedIcon />
              {t("galleryShowLess")}
            </button>
          )}
          {canShowMore && (
            <button
              type="button"
              className="image-gallery__toggle image-gallery__toggle--all"
              onClick={() => setVisibleCount(images.length)}
            >
              <CollectionsRoundedIcon />
              {t("galleryShowAll", { count: remaining })}
            </button>
          )}
          {canShowMore && (
            <button
              type="button"
              className="image-gallery__toggle image-gallery__toggle--more"
              onClick={() =>
                setVisibleCount((v) => Math.min(v + PAGE_SIZE, images.length))
              }
            >
              <AddRoundedIcon />
              {t("galleryShowMore", { count: PAGE_SIZE })}
            </button>
          )}
        </div>
      )}

      {active && (
        <div
          className="image-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={close}
        >
          <button
            type="button"
            className="image-gallery__lightbox-close"
            onClick={close}
            aria-label="Close"
          >
            <CloseRoundedIcon />
          </button>
          {images.length > 1 && (
            <button
              type="button"
              className="image-gallery__lightbox-arrow image-gallery__lightbox-arrow--left"
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
            alt={alt}
            className="image-gallery__lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button
              type="button"
              className="image-gallery__lightbox-arrow image-gallery__lightbox-arrow--right"
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
