"use client";
import { useState } from "react";
import { Link } from "@/navigation";
import "../EpisodeRatingGrid.scss";

export type SlimEpisode = {
  episode_number: number;
  name: string;
  vote_average: number;
};

export type SlimSeason = {
  season_number: number;
  lastEpNumber: number;
  average: number | null;
  averageTier: string;
  episodes: SlimEpisode[];
};

interface EpisodeRatingGridDesktopProps {
  seriesId: number;
  seasonData: SlimSeason[];
  epNums: number[];
  seasonPrefix: string;
  averageLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
  initialRows: number;
  step: number;
}

function ratingTier(rating: number): string {
  if (rating <= 0) return "egrid__cell--empty";
  if (rating >= 9.5) return "egrid__cell--cinema";
  if (rating >= 9.0) return "egrid__cell--awesome";
  if (rating >= 8.0) return "egrid__cell--great";
  if (rating >= 7.0) return "egrid__cell--good";
  if (rating >= 6.0) return "egrid__cell--regular";
  if (rating >= 5.0) return "egrid__cell--bad";
  return "egrid__cell--garbage";
}

export default function EpisodeRatingGridDesktop({
  seriesId,
  seasonData,
  epNums,
  seasonPrefix,
  averageLabel,
  showMoreLabel,
  showLessLabel,
  initialRows,
  step,
}: EpisodeRatingGridDesktopProps) {
  const [visible, setVisible] = useState(
    Math.min(initialRows, seasonData.length),
  );

  const visibleSeasons = seasonData.slice(0, visible);
  const needsLimiter = seasonData.length > initialRows;
  const canShowMore = visible < seasonData.length;
  const canShowLess = visible > initialRows;

  return (
    <div className="egrid-desktop">
      {/* ── Col izquierda: temporadas ──────────────────────────────────── */}
      <div className="egrid-desktop__col egrid-desktop__col--left">
        <div className="egrid-desktop__head-spacer" />
        {visibleSeasons.map((s) => (
          <div key={s.season_number} className="egrid-desktop__season-label">
            {seasonPrefix}
            {s.season_number}
          </div>
        ))}
      </div>

      {/* ── Centro: episodios (scroll horizontal independiente) ──────────── */}
      <div className="egrid-desktop__scroll">
        {/* Header E1, E2, ... */}
        <div className="egrid-desktop__ep-row egrid-desktop__ep-row--header">
          {epNums.map((epNum) => (
            <div key={epNum} className="egrid-desktop__ep-head">
              E{epNum}
            </div>
          ))}
        </div>

        {/* Filas de datos */}
        {visibleSeasons.map((s) => (
          <div key={s.season_number} className="egrid-desktop__ep-row">
            {epNums.map((epNum) => {
              if (epNum > s.lastEpNumber) {
                return (
                  <div
                    key={epNum}
                    className="egrid-desktop__ep-cell egrid-desktop__ep-cell--phantom"
                    aria-hidden="true"
                  />
                );
              }
              const ep = s.episodes.find((e) => e.episode_number === epNum);
              const rating = ep?.vote_average ?? 0;
              const ratingLabel = rating > 0 ? rating.toFixed(1) : "—";
              return (
                <Link
                  key={epNum}
                  href={`/series/${seriesId}/${s.season_number}x${epNum}`}
                  className={`egrid-desktop__ep-cell egrid__cell ${ratingTier(rating)}`}
                  title={ep ? `${ep.name} — ${ratingLabel}` : ""}
                  aria-label={
                    ep
                      ? `S${s.season_number}E${epNum} · ${ep.name} · ${ratingLabel}`
                      : undefined
                  }
                >
                  {ratingLabel}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Col derecha: promedios ─────────────────────────────────────── */}
      <div className="egrid-desktop__col egrid-desktop__col--right">
        <div className="egrid-desktop__head-avg">{averageLabel}</div>
        {visibleSeasons.map((s) => (
          <div key={s.season_number} className="egrid-desktop__avg-wrap">
            <span className={`egrid__cell egrid__cell--avg ${s.averageTier}`}>
              {s.average !== null ? s.average.toFixed(1) : "—"}
            </span>
          </div>
        ))}
      </div>

      {needsLimiter && (canShowMore || canShowLess) && (
        <div className="egrid-desktop__footer-buttons">
          {canShowMore && (
            <button
              type="button"
              className="egrid__more-btn"
              onClick={() =>
                setVisible((v) => Math.min(v + step, seasonData.length))
              }
            >
              {showMoreLabel}
            </button>
          )}
          {canShowLess && (
            <button
              type="button"
              className="egrid__more-btn egrid__more-btn--secondary"
              onClick={() => setVisible(initialRows)}
            >
              {showLessLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
