import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSeriesDetails } from "@/services/series";
import { posterUrl, backdropUrl, profileUrl, IMG_BASE } from "@/services/tmdb";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import WatchlistButton from "@/components/shared/WatchlistButton/WatchlistButton";
import WatchedButton from "@/components/shared/WatchedButton/WatchedButton";
import CastCarousel from "@/components/shared/CastCarousel/CastCarousel";
import SeasonEpisodes from "@/components/series/SeasonEpisodes/SeasonEpisodes";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import TrailerPlayer from "@/components/shared/TrailerPlayer/TrailerPlayer";
import FunFacts from "@/components/shared/FunFacts/FunFacts";
import { Link } from "@/navigation";
import { formatSpanishDate, isToday } from "@/utils/dates";
import { formatEpCode } from "@/utils/format";
import { getUserTimezone } from "@/utils/timezone";
import {
  getCertification,
  getProviders,
  getProviderHomepage,
  getSeriesStatusInfo,
  getSeriesYearDisplay,
  getTrailerKey,
} from "@/utils/media";
import { buildSeriesFunFacts } from "@/utils/funFacts";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import type {
  SeriesDetails,
  CastMember,
  StreamingProvider,
  Series,
} from "@/types/tmdb";

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

export default async function SerieDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
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

  const cast = series.credits?.cast?.slice(0, 20) ?? [];
  const { providers, link: watchLink } = getProviders(series);
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
            width={300}
            height={450}
            className="detail-poster"
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

          {isReturning && nextEp && nextEp.air_date && (
            <div
              className={`detail-next-episode${todayEpisode ? " detail-next-episode--today" : ""}`}
            >
              <span className="detail-next-episode__dot-label">
                <span className="detail-next-episode__dot" aria-hidden="true" />
                <span className="detail-next-episode__label">
                  {todayEpisode ? t("nextEpisodeToday") : t("nextEpisode")}
                </span>
              </span>
              <span className="detail-next-episode__divider" aria-hidden="true">
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
                  {formatSpanishDate(nextEp.air_date)}
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

      {providers.length > 0 && (
        <div className="detail-providers-section">
          <h3 className="section-title">{t("whereToWatch")}</h3>
          <div className="detail-providers-list">
            {watchLink && (
              <a
                href={watchLink}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-provider-badge detail-provider-badge"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/justwatch.svg"
                  alt="JustWatch"
                  width={28}
                  height={28}
                  className="detail-provider-logo"
                />
                JustWatch
              </a>
            )}
            {providers.map((p: StreamingProvider) => {
              const href = getProviderHomepage(p.provider_id);
              return href ? (
                <a
                  key={p.provider_id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-provider-badge"
                >
                  <Image
                    src={`${IMG_BASE}/w45${p.logo_path}`}
                    alt={p.provider_name}
                    width={28}
                    height={28}
                    className="detail-provider-logo"
                  />
                  {p.provider_name}
                </a>
              ) : (
                <div key={p.provider_id} className="detail-provider-badge">
                  <Image
                    src={`${IMG_BASE}/w45${p.logo_path}`}
                    alt={p.provider_name}
                    width={28}
                    height={28}
                    className="detail-provider-logo"
                  />
                  {p.provider_name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cast.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">{t("cast")}</h3>
          <CastCarousel>
            {cast.map((actor: CastMember) => (
              <Link
                key={actor.id}
                href={`/actor/${actor.id}`}
                className="detail-cast-card"
              >
                <FadeImage
                  src={profileUrl(actor.profile_path, "sm")}
                  alt={actor.name}
                  width={100}
                  height={100}
                  className="detail-cast-img"
                  skeletonVariant="circle"
                  loading="lazy"
                />
                <p className="detail-cast-name">{actor.name}</p>
                <p className="detail-cast-char">{actor.character}</p>
              </Link>
            ))}
          </CastCarousel>
        </div>
      )}

      {trailerKey && (
        <div className="detail-section">
          <h3 className="section-title">{t("trailer")}</h3>
          <TrailerPlayer videoKey={trailerKey} title={series.name} />
        </div>
      )}

      {series.seasons?.length > 0 && (
        <SeasonEpisodes seriesId={series.id} seasons={series.seasons} />
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
