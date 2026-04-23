import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSeriesDetails } from "@/services/series";
import { posterUrl, backdropUrl } from "@/services/tmdb";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import WatchlistButton from "@/components/shared/WatchlistButton/WatchlistButton";
import WatchedButton from "@/components/shared/WatchedButton/WatchedButton";
import SeriesFullCast from "@/components/series/Seriesfullcast/Seriesfullcast";
import SeasonEpisodes from "@/components/series/SeasonEpisodes/SeasonEpisodes";
import WatchProviders from "@/components/shared/WatchProviders/WatchProviders";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import TrailerPlayer from "@/components/shared/TrailerPlayer/TrailerPlayer";
import FunFacts from "@/components/shared/FunFacts/FunFacts";
import { formatLocalizedDate, isToday, isUpcoming } from "@/utils/dates";
import { formatEpCode } from "@/utils/format";
import { getUserTimezone } from "@/utils/timezone";
import {
  getCertification,
  getSeriesStatusInfo,
  getSeriesYearDisplay,
  getTrailerKey,
} from "@/utils/media";
import { buildSeriesFunFacts } from "@/utils/funFacts";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import type { SeriesDetails, Series } from "@/types/tmdb";

// Géneros de TV que TMDB no traduce correctamente al español
const TV_GENRE_NAME_OVERRIDES_ES: Record<number, string> = {
  10759: "Acción y Aventura",
  10765: "Ciencia Ficción y Fantasía",
  10768: "Bélica y Política",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "detail" });
  try {
    const series = (await getSeriesDetails(id)) as SeriesDetails;
    const year = series.first_air_date?.slice(0, 4) ?? "";
    const rating = series.vote_average
      ? `⭐ ${series.vote_average.toFixed(1)}`
      : "";
    const meta = [year, rating].filter(Boolean).join(" · ");
    const title = meta
      ? `${series.name} (${meta}) — Nextflix`
      : `${series.name} — Nextflix`;
    const description =
      series.overview?.slice(0, 155) +
        (series.overview && series.overview.length > 155 ? "…" : "") || title;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.tv_show",
        siteName: "Nextflix",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: t("metaSeriesFallback") };
  }
}

function CastSkeleton() {
  return (
    <div className="sk-cast">
      <div className="sk-cast__title" />
      <div className="sk-cast__grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="sk-cast__item">
            <div className="sk-cast__avatar" />
            <div className="sk-cast__name" />
            <div className="sk-cast__char" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SerieDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  const [t, tz] = await Promise.all([
    getTranslations("detail"),
    getUserTimezone(),
  ]);

  let series: SeriesDetails;
  try {
    series = (await getSeriesDetails(id)) as SeriesDetails;
  } catch {
    notFound();
  }

  // Aplicar overrides de nombres de géneros que TMDB no traduce al español
  if (locale === "es" && series.genres) {
    series = {
      ...series,
      genres: series.genres.map((g) => ({
        ...g,
        name: TV_GENRE_NAME_OVERRIDES_ES[g.id] ?? g.name,
      })),
    };
  }

  const mainCast = series.credits?.cast ?? [];
  const allWatchProviders = series["watch/providers"]?.results ?? {};
  const trailerKey = getTrailerKey(series.videos);
  const certification = getCertification(series);
  const recommendations = series.recommendations?.results?.slice(0, 15) ?? [];
  const yearDisplay = getSeriesYearDisplay(
    series.first_air_date,
    series.last_air_date,
  );
  const totalSeasons = series.number_of_seasons ?? 0;
  const { label: statusLabel, color: statusColor } = getSeriesStatusInfo(
    series.status,
    {
      onAir: t("statusOnAir"),
      ended: t("statusEnded"),
      canceled: t("statusCanceled"),
    },
  );

  const isReturning = series.status === "Returning Series";
  const nextEp = series.next_episode_to_air ?? null;
  const todayEpisode = isToday(nextEp?.air_date, tz);
  const funFacts = buildSeriesFunFacts(series, t);

  return (
    <div className="detail-page">
      <div className="detail-hero">
        {series.backdrop_path && (
          <FadeImage
            src={backdropUrl(series.backdrop_path)!}
            alt={series.name}
            fill
            className="detail-hero-bg"
            priority
            sizes="100vw"
            skeletonVariant="fill"
          />
        )}
        <div className="detail-hero-gradient" />
      </div>

      <div className="detail-info">
        <div className="detail-poster-wrap">
          <FadeImage
            src={posterUrl(series.poster_path, "lg")}
            alt={series.name}
            fill
            className="detail-poster"
            sizes="(max-width: 768px) 220px, (max-width: 1024px) 260px, 300px"
            priority
          />
        </div>
        <div className="detail-details">
          <div className="detail-title-row">
            <h1 className="detail-title">{series.name}</h1>
            {series.tagline && (
              <span className="detail-tagline">{series.tagline}</span>
            )}
          </div>
          <div className="detail-meta">
            <span className="detail-type-badge detail-type-badge--series">
              {t("series")}
            </span>
            {certification && (
              <span className="detail-certification">{certification}</span>
            )}
            {series.vote_average > 0 && (
              <span className="detail-rating">
                <StarRateRoundedIcon />
                {series.vote_average.toFixed(1)}
              </span>
            )}
            {yearDisplay && <span className="detail-year">{yearDisplay}</span>}
            {totalSeasons > 0 && (
              <span className="detail-runtime">
                {t("seasons", { count: totalSeasons })}
              </span>
            )}
            {series.episode_run_time?.[0] && (
              <span className="detail-runtime">
                {t("minPerEp", { min: series.episode_run_time[0] })}
              </span>
            )}
            <span className="detail-runtime" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>

          {isReturning &&
            nextEp &&
            nextEp.air_date &&
            isUpcoming(nextEp.air_date, tz) && (
              <div
                className={`detail-next-episode${todayEpisode ? " detail-next-episode--today" : ""}`}
              >
                <span className="detail-next-episode__dot-label">
                  <span
                    className="detail-next-episode__dot"
                    aria-hidden="true"
                  />
                  <span className="detail-next-episode__label">
                    {todayEpisode ? t("nextEpisodeToday") : t("nextEpisode")}
                  </span>
                </span>
                <span
                  className="detail-next-episode__divider"
                  aria-hidden="true"
                >
                  /
                </span>
                <span className="detail-next-episode__info">
                  <span className="detail-next-episode__ep">
                    {formatEpCode(nextEp)}
                  </span>
                  {nextEp.name && (
                    <span className="detail-next-episode__name">
                      {nextEp.name}
                    </span>
                  )}
                  <span className="detail-next-episode__date">
                    {formatLocalizedDate(nextEp.air_date, locale)}
                  </span>
                </span>
              </div>
            )}

          <div className="detail-genres">
            {series.genres?.map((g) => (
              <span key={g.id} className="genre-tag">
                {g.name}
              </span>
            ))}
          </div>
          {series.overview && (
            <p className="detail-overview">{series.overview}</p>
          )}
          <div className="detail-actions">
            <WatchlistButton item={series} mediaType="tv" />
            <WatchedButton item={series} mediaType="tv" />
          </div>
        </div>
      </div>

      <WatchProviders allProviders={allWatchProviders} locale={locale} />

      {/*
        Reparto unificado: principal + invitados de todas las temporadas.
        Se carga en streaming con Suspense para no bloquear el render inicial.
      */}
      {(mainCast.length > 0 || (series.seasons?.length ?? 0) > 0) && (
        <Suspense fallback={<CastSkeleton />}>
          <SeriesFullCast
            seriesId={series.id}
            mainCast={mainCast}
            seasons={series.seasons ?? []}
            title={t("cast")}
          />
        </Suspense>
      )}

      {trailerKey && (
        <div className="detail-section">
          <h3 className="section-title">{t("trailer")}</h3>
          <TrailerPlayer videoKey={trailerKey} title={series.name} />
        </div>
      )}

      {series.seasons?.length > 0 && (
        <SeasonEpisodes
          seriesId={series.id}
          seasons={series.seasons}
          locale={locale}
        />
      )}

      <FunFacts title={t("funFacts")} facts={funFacts} />

      {recommendations.length > 0 && (
        <Carousel title={t("recommendations")}>
          {recommendations.map((s: Series) => (
            <MediaCard key={s.id} item={s} mediaType="tv" />
          ))}
        </Carousel>
      )}

      <div style={{ height: "4rem" }} />
    </div>
  );
}
