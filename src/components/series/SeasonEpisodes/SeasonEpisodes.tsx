"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import VideoGrid from "@/components/shared/VideoGrid/VideoGrid";
import { getSeasonDetails, getSeasonVideos } from "@/services/series";
import { posterUrl } from "@/services/tmdb";
import { formatDate } from "@/utils/dates";
import type { Season, Episode, SeasonDetails, Video } from "@/types/tmdb";

interface SeasonEpisodesProps {
  seriesId: number;
  seasons: Season[];
}

export default function SeasonEpisodes({
  seriesId,
  seasons,
}: SeasonEpisodesProps) {
  const t = useTranslations("detail");
  const validSeasons = seasons.filter(
    (s) => s.season_number > 0 && s.episode_count > 0,
  );
  const [activeSeason, setActiveSeason] = useState(
    validSeasons[0]?.season_number ?? 1,
  );
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [seasonVideos, setSeasonVideos] = useState<Video[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getSeasonDetails(seriesId, activeSeason),
      getSeasonVideos(seriesId, activeSeason).catch(() => ({ results: [] })),
    ])
      .then(([seasonData, videosData]) => {
        if (cancelled) return;
        const season = seasonData as SeasonDetails;
        setEpisodes(season.episodes ?? []);
        const ytVideos = (videosData.results ?? []).filter(
          (v) => v.site === "YouTube",
        );
        setSeasonVideos(ytVideos);
      })
      .catch(() => {
        if (!cancelled) {
          setEpisodes([]);
          setSeasonVideos([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [seriesId, activeSeason]);

  const handleSeasonChange = (seasonNumber: number) => {
    setEpisodes(null);
    setSeasonVideos([]);
    setActiveSeason(seasonNumber);
  };

  if (validSeasons.length === 0) return null;

  return (
    <div className="detail-section">
      <h3 className="section-title">{t("seasonsAndEpisodes")}</h3>

      <div className="detail-season-selector">
        {validSeasons.map((s) => (
          <button
            key={s.season_number}
            className={`detail-season-btn ${activeSeason === s.season_number ? "detail-season-btn--active" : ""}`}
            onClick={() => handleSeasonChange(s.season_number)}
          >
            {t("seasonPrefix")}
            {s.season_number}
          </button>
        ))}
      </div>

      {episodes === null ? (
        <div style={{ padding: "2rem 0", color: "#737373" }}>
          Cargando episodios...
        </div>
      ) : (
        <>
          <div className="detail-episode-list">
            {episodes.map((ep) => (
              <div key={ep.id} className="detail-episode-card">
                <div className="detail-ep-visual">
                  {ep.still_path && (
                    <FadeImage
                      src={posterUrl(ep.still_path, "sm")}
                      alt={ep.name}
                      width={160}
                      height={90}
                      className="detail-ep-still"
                      loading="lazy"
                      sizes="(min-width: 768px) 160px, 110px"
                    />
                  )}
                  <div className="detail-ep-meta detail-ep-meta--mobile">
                    {ep.air_date && <span>{formatDate(ep.air_date)}</span>}
                    {ep.vote_average > 0 && (
                      <span>⭐ {ep.vote_average.toFixed(1)}</span>
                    )}
                    {ep.runtime && <span>{ep.runtime} min</span>}
                  </div>
                </div>
                <div className="detail-ep-info">
                  <p className="detail-ep-title">
                    {ep.episode_number}. {ep.name}
                  </p>
                  <div className="detail-ep-meta detail-ep-meta--desktop">
                    {ep.air_date && <span>{formatDate(ep.air_date)}</span>}
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

          {seasonVideos.length > 0 && (
            <VideoGrid videos={seasonVideos} title={t("seasonVideos")} />
          )}
        </>
      )}
    </div>
  );
}
