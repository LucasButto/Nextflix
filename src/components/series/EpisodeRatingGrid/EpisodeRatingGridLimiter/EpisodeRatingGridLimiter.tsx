"use client";
import { useState, type ReactNode } from "react";

interface EpisodeRatingGridLimiterProps {
  totalRows: number;
  step: number;
  rows: ReactNode[];
  showMoreLabel: string;
  showLessLabel: string;
  trailingRow?: ReactNode;
}

export default function EpisodeRatingGridLimiter({
  totalRows,
  step,
  rows,
  showMoreLabel,
  showLessLabel,
  trailingRow,
}: EpisodeRatingGridLimiterProps) {
  const [visible, setVisible] = useState(Math.min(step, totalRows));

  const remaining = totalRows - visible;
  const canShowMore = remaining > 0;
  const canShowLess = visible > step;

  const handleShowMore = () => {
    setVisible((v) => Math.min(v + step, totalRows));
  };

  const handleShowLess = () => {
    setVisible(Math.min(step, totalRows));
  };

  return (
    <>
      {rows.slice(0, visible)}
      {(canShowMore || canShowLess) && (
        <tr className="egrid__more-row">
          {/* Celda vacía que empareja con la columna de row-heads */}
          <td className="egrid__more-spacer" aria-hidden="true" />
          <td
            className="egrid__more-cell"
            colSpan={100}
            /* colSpan grande para abarcar todas las columnas restantes;
               el browser clampa al número real, no hace falta calcularlo. */
          >
            <div className="egrid__more-actions">
              {canShowMore && (
                <button
                  type="button"
                  className="egrid__more-btn"
                  onClick={handleShowMore}
                >
                  {showMoreLabel}
                </button>
              )}
              {canShowLess && (
                <button
                  type="button"
                  className="egrid__more-btn egrid__more-btn--secondary"
                  onClick={handleShowLess}
                >
                  {showLessLabel}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
      {trailingRow}
    </>
  );
}
