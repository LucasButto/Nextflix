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
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { posterUrl } from "@/services/tmdb";
import "./RandomPicker.scss";

export interface PickerProvider {
  id: number;
  name: string;
  logo_path: string;
}

export interface RandomPickerItem {
  id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  providers?: PickerProvider[];
}

interface RandomPickerProps {
  onClose: () => void;
  items: RandomPickerItem[];
  loadingProviders?: boolean;
}

const ITEM_HEIGHT = 60;
const STRIP_LENGTH = 50;
const WINNER_INDEX = 46;
const SPIN_DURATION_MS = 3600;

const POPULAR_PROVIDER_IDS = new Set([
  8,
  1796, // Netflix
  9,
  119, // Amazon Prime Video
  337, // Disney Plus
  350, // Apple TV Plus
  384,
  1899, // HBO Max / Max
  531, // Paramount Plus
  619, // Star Plus
]);

function isPopularProvider(p: PickerProvider): boolean {
  if (POPULAR_PROVIDER_IDS.has(p.id)) return true;
  const name = p.name.toLowerCase();
  return name.includes("claro video") || name.includes("claro tv");
}

/** Normaliza un nombre de plataforma para comparación */
function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RandomPicker({
  onClose,
  items,
  loadingProviders = false,
}: RandomPickerProps) {
  const t = useTranslations("myList.randomPicker");

  // ─── Type filter ───────────────────────────────────────────────────────────
  const hasMovies = useMemo(
    () => items.some((i) => i.media_type === "movie"),
    [items],
  );
  const hasSeries = useMemo(
    () => items.some((i) => i.media_type === "tv"),
    [items],
  );
  const showTypeFilters = hasMovies && hasSeries;

  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeSeries, setIncludeSeries] = useState(true);

  // ─── Platform filter ───────────────────────────────────────────────────────
  // null = "Todas las plataformas" / Set<normalizedName> = selección específica
  const [selectedNames, setSelectedNames] = useState<Set<string> | null>(null);
  const [platformListOpen, setPlatformListOpen] = useState(false);

  const hasProviderData = useMemo(
    () => items.some((i) => i.providers !== undefined),
    [items],
  );

  const typeFilteredItems = useMemo(
    () =>
      items.filter((it) => {
        if (it.media_type === "movie") return includeMovies;
        if (it.media_type === "tv") return includeSeries;
        return false;
      }),
    [items, includeMovies, includeSeries],
  );

  // Providers únicos por nombre normalizado (elimina duplicados como Prime 9/119)
  const allProviders = useMemo(() => {
    const seen = new Map<string, PickerProvider>();
    for (const item of typeFilteredItems) {
      for (const p of item.providers ?? []) {
        const key = normalizeName(p.name);
        if (!seen.has(key)) seen.set(key, p);
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [typeFilteredItems]);

  const popularProviders = useMemo(
    () => allProviders.filter(isPopularProvider),
    [allProviders],
  );
  const otherProviders = useMemo(
    () => allProviders.filter((p) => !isPopularProvider(p)),
    [allProviders],
  );

  // Pool final: tipo + plataforma (matchea por nombre normalizado)
  const pool = useMemo(() => {
    return typeFilteredItems.filter((item) => {
      if (!hasProviderData || selectedNames === null) return true;
      if (item.providers === undefined) return true;
      if (item.providers.length === 0) return false;
      return item.providers.some((p) =>
        selectedNames.has(normalizeName(p.name)),
      );
    });
  }, [typeFilteredItems, hasProviderData, selectedNames]);

  // ─── Reel ──────────────────────────────────────────────────────────────────
  const [strip, setStrip] = useState<RandomPickerItem[]>([]);
  const [translateY, setTranslateY] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RandomPickerItem | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  // ─── Side effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (platformListOpen) {
          setPlatformListOpen(false);
        } else if (!spinning) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, spinning, platformListOpen]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null)
        window.clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  // ─── Toggle plataforma ─────────────────────────────────────────────────────
  const toggleProvider = (name: string) => {
    const key = normalizeName(name);
    setSelectedNames((prev) => {
      if (prev === null) {
        // De "todas" → seleccionar solo esta
        return new Set([key]);
      }
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Si el Set queda vacío → volver a "todas"
        return next.size === 0 ? null : next;
      } else {
        next.add(key);
        return next;
      }
    });
    // NO cerramos el dropdown — el usuario puede seguir eligiendo
  };

  const resetProviders = () => {
    setSelectedNames(null);
    setPlatformListOpen(false);
  };

  // ─── Derived display values ────────────────────────────────────────────────
  const selectedCount = selectedNames?.size ?? 0;
  const singleSelected =
    selectedCount === 1
      ? (allProviders.find((p) => selectedNames!.has(normalizeName(p.name))) ??
        null)
      : null;

  // ─── Spin ──────────────────────────────────────────────────────────────────
  const canSpin = pool.length > 0 && !spinning;

  const handleSpin = () => {
    if (!canSpin) return;
    setPlatformListOpen(false);

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

    if (spinTimeoutRef.current !== null)
      window.clearTimeout(spinTimeoutRef.current);

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setResult(winner);
      spinTimeoutRef.current = null;
    }, SPIN_DURATION_MS);
  };

  // ─── Hints ─────────────────────────────────────────────────────────────────
  const emptyAll = items.length === 0;
  const noTypeFilter = showTypeFilters && !includeMovies && !includeSeries;
  const emptyForFilter =
    !emptyAll && !noTypeFilter && pool.length === 0 && !loadingProviders;

  const showProviderSection =
    loadingProviders || (hasProviderData && allProviders.length > 0);

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
        if (platformListOpen) {
          setPlatformListOpen(false);
          return;
        }
        if (!spinning) onClose();
      }}
    >
      <div
        className="random-picker__modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="random-picker__body">
          {emptyAll ? (
            <p className="random-picker__hint">{t("empty")}</p>
          ) : (
            <>
              {/* Type filter */}
              {showTypeFilters && (
                <div className="random-picker__filters">
                  <label
                    className={`random-picker__filter ${includeMovies ? "random-picker__filter--checked" : ""} ${spinning ? "random-picker__filter--disabled" : ""}`}
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
                    className={`random-picker__filter ${includeSeries ? "random-picker__filter--checked" : ""} ${spinning ? "random-picker__filter--disabled" : ""}`}
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
              )}

              {/* Platform selector */}
              {showProviderSection && (
                <div className="random-picker__providers">
                  <span className="random-picker__providers-label">
                    {t("platforms")}
                  </span>

                  {loadingProviders ? (
                    <div className="random-picker__platform-trigger random-picker__platform-trigger--loading">
                      <span className="random-picker__btn-spinner" />
                      <span className="random-picker__platform-trigger-name">
                        {t("loadingPlatforms")}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Trigger */}
                      <button
                        type="button"
                        className={`random-picker__platform-trigger ${platformListOpen ? "random-picker__platform-trigger--open" : ""}`}
                        onClick={() => setPlatformListOpen((v) => !v)}
                        disabled={spinning}
                      >
                        {selectedNames === null ? (
                          <span className="random-picker__platform-trigger-name">
                            {t("allPlatforms")}
                          </span>
                        ) : singleSelected ? (
                          <>
                            <img
                              src={singleSelected.logo_path}
                              alt=""
                              className="random-picker__platform-logo"
                            />
                            <span className="random-picker__platform-trigger-name">
                              {singleSelected.name}
                            </span>
                          </>
                        ) : (
                          <span className="random-picker__platform-trigger-name">
                            {t("nPlatforms", { count: selectedCount })}
                          </span>
                        )}
                        <KeyboardArrowDownRoundedIcon
                          className={`random-picker__platform-chevron ${platformListOpen ? "random-picker__platform-chevron--open" : ""}`}
                        />
                      </button>

                      {/* Inline list — stays open for multi-select */}
                      {platformListOpen && (
                        <div className="random-picker__platform-list">
                          {/* All option */}
                          <button
                            type="button"
                            className={`random-picker__platform-option ${selectedNames === null ? "random-picker__platform-option--active" : ""}`}
                            onClick={resetProviders}
                          >
                            <span className="random-picker__platform-option-name">
                              {t("allPlatforms")}
                            </span>
                            {selectedNames === null && (
                              <CheckRoundedIcon className="random-picker__platform-check" />
                            )}
                          </button>

                          {/* Popular */}
                          {popularProviders.length > 0 && (
                            <>
                              <div className="random-picker__platform-divider" />
                              <div className="random-picker__platform-section-title">
                                {t("popularPlatforms")}
                              </div>
                              {popularProviders.map((p) => {
                                const isActive =
                                  selectedNames !== null &&
                                  selectedNames.has(normalizeName(p.name));
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className={`random-picker__platform-option ${isActive ? "random-picker__platform-option--active" : ""}`}
                                    onClick={() => toggleProvider(p.name)}
                                  >
                                    <img
                                      src={p.logo_path}
                                      alt=""
                                      className="random-picker__platform-logo"
                                    />
                                    <span className="random-picker__platform-option-name">
                                      {p.name}
                                    </span>
                                    {isActive && (
                                      <CheckRoundedIcon className="random-picker__platform-check" />
                                    )}
                                  </button>
                                );
                              })}
                            </>
                          )}

                          {/* Others */}
                          {otherProviders.length > 0 && (
                            <>
                              <div className="random-picker__platform-divider" />
                              <div className="random-picker__platform-section-title">
                                {t("otherPlatforms")}
                              </div>
                              {otherProviders.map((p) => {
                                const isActive =
                                  selectedNames !== null &&
                                  selectedNames.has(normalizeName(p.name));
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className={`random-picker__platform-option ${isActive ? "random-picker__platform-option--active" : ""}`}
                                    onClick={() => toggleProvider(p.name)}
                                  >
                                    <img
                                      src={p.logo_path}
                                      alt=""
                                      className="random-picker__platform-logo"
                                    />
                                    <span className="random-picker__platform-option-name">
                                      {p.name}
                                    </span>
                                    {isActive && (
                                      <CheckRoundedIcon className="random-picker__platform-check" />
                                    )}
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Reel */}
              <div className="random-picker__reel">
                {strip.length > 0 ? (
                  <>
                    <div
                      className={`random-picker__strip ${transitionOn ? "random-picker__strip--animating" : ""}`}
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
                      className={`random-picker__indicator ${result ? "random-picker__indicator--won" : ""}`}
                    />
                  </>
                ) : (
                  <div className="random-picker__placeholder">
                    <CasinoRoundedIcon className="random-picker__placeholder-icon" />
                    <p>{t("placeholder")}</p>
                  </div>
                )}
              </div>

              {/* Hints */}
              {noTypeFilter && (
                <p className="random-picker__hint random-picker__hint--warn">
                  {t("needSelection")}
                </p>
              )}
              {!noTypeFilter && emptyForFilter && (
                <p className="random-picker__hint random-picker__hint--warn">
                  {t("emptyForFilter")}
                </p>
              )}

              {/* Actions */}
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
