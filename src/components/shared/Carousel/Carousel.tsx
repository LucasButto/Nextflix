"use client";
import { useRef, useState, useEffect, ReactNode } from "react";
import { useTranslations } from "next-intl";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import "./Carousel.scss";

interface CarouselProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Carousel({
  title,
  children,
  className = "",
}: CarouselProps) {
  const t = useTranslations("carousel");
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
  }, [children]);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className={`carousel-section ${className}`}>
      {title && <h2 className="section-title">{title}</h2>}
      <div className="carousel-wrapper">
        {canScrollLeft && (
          <button
            className="carousel-arrow carousel-arrow--left"
            onClick={() => scroll("left")}
            aria-label={t("prev")}
          >
            <ArrowBackIosRoundedIcon />
          </button>
        )}
        <div className="carousel-track" ref={trackRef}>
          {children}
        </div>
        {canScrollRight && (
          <button
            className="carousel-arrow carousel-arrow--right"
            onClick={() => scroll("right")}
            aria-label={t("next")}
          >
            <ArrowForwardIosRoundedIcon />
          </button>
        )}
      </div>
    </section>
  );
}
