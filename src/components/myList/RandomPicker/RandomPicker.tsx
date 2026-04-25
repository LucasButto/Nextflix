"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { posterUrl } from "@/services/tmdb";
import "./RandomPicker.scss";

export interface RandomPickerItem {
  id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
}

interface RandomPickerProps {
  onClose: () => void;
  items: RandomPickerItem[];
}

// Cada fila de la tira mide 60px. El "viewport" muestra 3 filas (180px),
// con el indicador centrado sobre la fila del medio.
const ITEM_HEIGHT = 60;
const STRIP_LENGTH = 50;
const WINNER_INDEX = 46; // ganador cerca del final para que se vea harto scroll
const SPIN_DURATION_MS = 3600;

// Fisher-Yates: devuelve una copia barajada del array.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RandomPicker({ onClose, items }: RandomPickerProps) {
  const t = useTranslations("myList.randomPicker");

  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeSeries, setIncludeSeries] = useState(true);

  const [strip, setStrip] = useState<RandomPickerItem[]>([]);
  const [translateY, setTranslateY] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RandomPickerItem | null>(null);

  const spinTimeoutRef = useRef<number | null>(null);

  const pool = useMemo(
    () =>
      items.filter((it) => {
        if (it.media_type === "movie") return includeMovies;
        if (it.media_type === "tv") return includeSeries;
        return false;
      }),
    [items, includeMovies, includeSeries],
  );

  // Bloquear scroll del body mientras el modal vive
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !spinning) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, spinning]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const canSpin = pool.length > 0 && !spinning;
  const noFilter = !includeMovies && !includeSeries;
  const emptyAll = items.length === 0;
  const emptyForFilter = !emptyAll && !noFilter && pool.length === 0;

  const handleSpin = () => {
    if (!canSpin) return;

    const shuffled = shuffle(pool);
    const newStrip: RandomPickerItem[] = Array.from(
      { length: STRIP_LENGTH },
      (_, i) => shuffled[i % shuffled.length],
    );

    const winner = newStrip[WINNER_INDEX];

    setResult(null);
    setStrip(newStrip);
    setTranslateY(0);
    setTransitionOn(false);
    setSpinning(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionOn(true);
        setTranslateY(-(WINNER_INDEX - 1) * ITEM_HEIGHT);
      });
    });

    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }
    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setResult(winner);
      spinTimeoutRef.current = null;
    }, SPIN_DURATION_MS);
  };

  const showStrip = strip.length > 0;
  const winnerHref = result
    ? result.media_type === "tv"
      ? `/series/${result.id}`
      : `/movies/${result.id}`
    : "";

  return (
    <div
      className="random-picker__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="random-picker-title"
      onClick={() => {
        if (!spinning) onClose();
      }}
    >
      <div
        className="random-picker__modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="random-picker__header">
          <div id="random-picker-title" className="random-picker__title">
            <CasinoRoundedIcon />
            {t("title")}
          </div>
          <button
            type="button"
            className="random-picker__close"
            onClick={onClose}
            disabled={spinning}
            aria-label={t("close")}
          >
            <CloseRoundedIcon />
          </button>
        </div>

        <div className="random-picker__body">
          {emptyAll ? (
            <p className="random-picker__hint">{t("empty")}</p>
          ) : (
            <>
              <div className="random-picker__filters">
                <label
                  className={`random-picker__filter ${
                    includeMovies ? "random-picker__filter--checked" : ""
                  } ${spinning ? "random-picker__filter--disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={includeMovies}
                    onChange={(e) => setIncludeMovies(e.target.checked)}
                    disabled={spinning}
                  />
                  <span className="random-picker__filter-icon">
                    <MovieRoundedIcon />
                  </span>
                  <span className="random-picker__filter-label">
                    {t("movies")}
                  </span>
                </label>
                <label
                  className={`random-picker__filter ${
                    includeSeries ? "random-picker__filter--checked" : ""
                  } ${spinning ? "random-picker__filter--disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={includeSeries}
                    onChange={(e) => setIncludeSeries(e.target.checked)}
                    disabled={spinning}
                  />
                  <span className="random-picker__filter-icon">
                    <LiveTvRoundedIcon />
                  </span>
                  <span className="random-picker__filter-label">
                    {t("series")}
                  </span>
                </label>
              </div>

              <div className="random-picker__reel">
                {showStrip ? (
                  <>
                    <div
                      className={`random-picker__strip ${
                        transitionOn ? "random-picker__strip--animating" : ""
                      }`}
                      style={{ transform: `translateY(${translateY}px)` }}
                    >
                      {strip.map((it, idx) => (
                        <div key={idx} className="random-picker__strip-item">
                          <FadeImage
                            src={posterUrl(it.poster_path, "xs")}
                            alt=""
                            width={36}
                            height={54}
                            sizes="36px"
                            className="random-picker__strip-poster"
                            loading="lazy"
                          />
                          <span className="random-picker__strip-title">
                            {it.title}
                          </span>
                          {it.media_type === "tv" ? (
                            <LiveTvRoundedIcon className="random-picker__strip-type" />
                          ) : (
                            <MovieRoundedIcon className="random-picker__strip-type" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="random-picker__fade random-picker__fade--top" />
                    <div className="random-picker__fade random-picker__fade--bottom" />
                    <div
                      className={`random-picker__indicator ${
                        result ? "random-picker__indicator--won" : ""
                      }`}
                    />
                  </>
                ) : (
                  <div className="random-picker__placeholder">
                    <CasinoRoundedIcon className="random-picker__placeholder-icon" />
                    <p>{t("placeholder")}</p>
                  </div>
                )}
              </div>

              {(noFilter || emptyForFilter) && (
                <p className="random-picker__hint random-picker__hint--warn">
                  {noFilter ? t("needSelection") : t("emptyForFilter")}
                </p>
              )}

              <div className="random-picker__actions">
                {result && (
                  <Link
                    href={winnerHref}
                    onClick={onClose}
                    className="random-picker__btn random-picker__btn--secondary"
                  >
                    <OpenInNewRoundedIcon />
                    {t("viewDetail")}
                  </Link>
                )}
                <button
                  type="button"
                  className="random-picker__btn random-picker__btn--primary"
                  onClick={handleSpin}
                  disabled={!canSpin}
                >
                  {spinning ? (
                    <>
                      <span className="random-picker__btn-spinner" />
                      {t("spinning")}
                    </>
                  ) : result ? (
                    <>
                      <ReplayRoundedIcon />
                      {t("again")}
                    </>
                  ) : (
                    <>
                      <CasinoRoundedIcon />
                      {t("spin")}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
