"use client";
import { useState } from "react";
import { Link } from "@/navigation";
import type { SlimSeason } from "../EpisodeRatingGridDesktop/EpisodeRatingGridDesktop";

interface EpisodeRatingGridMobileProps {
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

/**
 * Layout mobile de la grilla de ratings.
 * Estructura:
 *   [div.egrid-mobile-wrapper  ← scroll container]
 *     [table.egrid--mobile]
 *       [thead: T1 T2 ...]
 *       [tbody: E1..En visible + fila Prom. siempre al final]
 *   [div.egrid-mobile-buttons  ← FUERA del scroll, siempre visible]
 *     [Mostrar más] [Mostrar menos]
 *
 * Los botones están fuera del wrapper para que no desaparezcan al scrollear.
 * La fila de promedios está siempre en el tbody (no depende del limiter).
 */
export default function EpisodeRatingGridMobile({
  seriesId,
  seasonData,
  epNums,
  seasonPrefix,
  averageLabel,
  showMoreLabel,
  showLessLabel,
  initialRows,
  step,
}: EpisodeRatingGridMobileProps) {
  const [visible, setVisible] = useState(Math.min(initialRows, epNums.length));

  const visibleEpNums = epNums.slice(0, visible);
  const needsLimiter = epNums.length > initialRows;
  const canShowMore = visible < epNums.length;
  const canShowLess = visible > initialRows;

  return (
    <>
      {/* Scroll container — solo la tabla scrollea aquí */}
      <div className="egrid-mobile-wrapper">
        <table className="egrid egrid--mobile">
          <thead>
            <tr>
              <th className="egrid__corner" aria-hidden="true" />
              {seasonData.map((s) => (
                <th key={s.season_number} className="egrid__head" scope="col">
                  {seasonPrefix}
                  {s.season_number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Filas de episodios — controladas por el limiter */}
            {visibleEpNums.map((epNum) => (
              <tr key={epNum}>
                <th className="egrid__row-head" scope="row">
                  E{epNum}
                </th>
                {seasonData.map((s) => {
                  if (epNum > s.lastEpNumber) {
                    return (
                      <td
                        key={s.season_number}
                        className="egrid__cell-wrap"
                        aria-hidden="true"
                      >
                        <span className="egrid__cell egrid__cell--missing">
                          —
                        </span>
                      </td>
                    );
                  }
                  const ep = s.episodes.find((e) => e.episode_number === epNum);
                  const rating = ep?.vote_average ?? 0;
                  const ratingLabel = rating > 0 ? rating.toFixed(1) : "—";
                  return (
                    <td key={s.season_number} className="egrid__cell-wrap">
                      <Link
                        href={`/series/${seriesId}/${s.season_number}x${epNum}`}
                        className={`egrid__cell ${ratingTier(rating)}`}
                        title={ep ? `${ep.name} — ${ratingLabel}` : ""}
                      >
                        {ratingLabel}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Fila de promedios — SIEMPRE al final, nunca se oculta */}
            <tr className="egrid__avg-row">
              <th className="egrid__row-head egrid__row-head--avg" scope="row">
                {averageLabel}
              </th>
              {seasonData.map((s) => (
                <td key={s.season_number} className="egrid__cell-wrap">
                  <span
                    className={`egrid__cell egrid__cell--avg ${s.averageTier}`}
                  >
                    {s.average !== null ? s.average.toFixed(1) : "—"}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botones FUERA del scroll — siempre visibles, debajo del promedio */}
      {needsLimiter && (canShowMore || canShowLess) && (
        <div className="egrid-mobile-buttons">
          {canShowMore && (
            <button
              type="button"
              className="egrid__more-btn"
              onClick={() =>
                setVisible((v) => Math.min(v + step, epNums.length))
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
    </>
  );
}
