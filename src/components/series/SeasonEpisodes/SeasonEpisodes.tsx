"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getSeasonDetails } from "@/services/series";
import { posterUrl } from "@/services/tmdb";
import type { Season, Episode, SeasonDetails } from "@/types/tmdb";

interface SeasonEpisodesProps {
  seriesId: number;
  seasons: Season[];
}

export default function SeasonEpisodes({
  seriesId,
  seasons,
}: SeasonEpisodesProps) {
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const [activeSeason, setActiveSeason] = useState(
    validSeasons[0]?.season_number ?? 1,
  );
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSeasonDetails(seriesId, activeSeason)
      .then((data) => {
        if (!cancelled) {
          const season = data as SeasonDetails;
          setEpisodes(season.episodes ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [seriesId, activeSeason]);

  const handleSeasonChange = (seasonNumber: number) => {
    setEpisodes(null);
    setActiveSeason(seasonNumber);
  };

  return (
    <div className="detail-section">
      <h3 className="section-title">Temporadas y Episodios</h3>

      <div className="detail-season-selector">
        {validSeasons.map((s) => (
          <button
            key={s.season_number}
            className={`detail-season-btn ${activeSeason === s.season_number ? "detail-season-btn--active" : ""}`}
            onClick={() => handleSeasonChange(s.season_number)}
          >
            T{s.season_number}
          </button>
        ))}
      </div>

      {episodes === null ? (
        <div style={{ padding: "2rem 0", color: "#737373" }}>
          Cargando episodios...
        </div>
      ) : (
        <div className="detail-episode-list">
          {episodes.map((ep) => (
            <div key={ep.id} className="detail-episode-card">
              {ep.still_path && (
                <Image
                  src={posterUrl(ep.still_path, "sm")}
                  alt={ep.name}
                  width={160}
                  height={90}
                  className="detail-ep-still"
                  loading="lazy"
                  sizes="160px"
                />
              )}
              <span className="detail-ep-number">{ep.episode_number}</span>
              <div className="detail-ep-info">
                <p className="detail-ep-title">{ep.name}</p>
                <div className="detail-ep-meta">
                  {ep.air_date && <span>{ep.air_date}</span>}
                  {ep.vote_average > 0 && (
                    <span>⭐ {ep.vote_average.toFixed(1)}</span>
                  )}
                  {ep.runtime && <span>{ep.runtime} min</span>}
                </div>
                {ep.overview && (
                  <p className="detail-ep-overview">{ep.overview}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
