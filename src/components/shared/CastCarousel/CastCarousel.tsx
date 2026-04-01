"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import "./CastCarousel.scss";

interface CastCarouselProps {
  children: React.ReactNode;
}

export default function CastCarousel({ children }: CastCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateButtons();

    const observer = new ResizeObserver(updateButtons);
    observer.observe(el);
    el.addEventListener("scroll", updateButtons, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateButtons);
    };
  }, [updateButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <div className="cast-carousel">
      {hasOverflow && (
        <button
          className={`cast-carousel__btn cast-carousel__btn--left ${!canScrollLeft ? "cast-carousel__btn--hidden" : ""}`}
          onClick={() => scroll("left")}
          aria-label="Scroll izquierda"
        >
          <ChevronLeftRoundedIcon />
        </button>
      )}

      <div className="cast-carousel__track" ref={scrollRef}>
        {children}
      </div>

      {hasOverflow && (
        <button
          className={`cast-carousel__btn cast-carousel__btn--right ${!canScrollRight ? "cast-carousel__btn--hidden" : ""}`}
          onClick={() => scroll("right")}
          aria-label="Scroll derecha"
        >
          <ChevronRightRoundedIcon />
        </button>
      )}
    </div>
  );
}
