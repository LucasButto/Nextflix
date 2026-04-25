import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getEpisodeDetails, getSeriesDetails } from "@/services/series";
import { posterUrl, backdropUrl, profileUrl, IMG_BASE } from "@/services/tmdb";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import CastCarousel from "@/components/shared/CastCarousel/CastCarousel";
import VideoGrid from "@/components/shared/VideoGrid/VideoGrid";
import EpisodeStills from "@/components/series/EpisodeStills/EpisodeStills";
import { Link } from "@/navigation";
import { formatLocalizedDate } from "@/utils/dates";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import type {
  EpisodeDetails,
  GuestStar,
  SeriesDetails,
  CastMember,
  CrewMember,
  Season,
} from "@/types/tmdb";
import "@/styles/pages/episode/episode.scss";

interface EpisodePageParams {
  locale: string;
  id: string;
  seasonEpisode: string;
}

/**
 * Parsea el slug "SxE" o "SxEE" (ej: "2x8", "12x08") a números.
 * Acepta la 'x' en cualquier caso (x / X) y episodios con o sin zero-padding.
 * Retorna null si el formato no matchea.
 */
function parseSeasonEpisode(
  slug: string,
): { season: number; episode: number } | null {
  const match = /^(\d+)[xX](\d+)$/.exec(slug);
  if (!match) return null;
  const season = Number(match[1]);
  const episode = Number(match[2]);
  if (!Number.isFinite(season) || !Number.isFinite(episode)) return null;
  if (season < 0 || episode < 1) return null;
  return { season, episode };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<EpisodePageParams>;
}) {
  const { locale, id, seasonEpisode } = await params;
  const t = await getTranslations({ locale, namespace: "detail" });
  const parsed = parseSeasonEpisode(seasonEpisode);
  if (!parsed) return { title: t("metaEpisodeFallback") };

  try {
    const [series, episode] = await Promise.all([
      getSeriesDetails(id) as Promise<SeriesDetails>,
      getEpisodeDetails(id, parsed.season, parsed.episode),
    ]);
    const epCode = `${t("seasonPrefix")}${episode.season_number}E${episode.episode_number}`;
    const title = `${series.name} — ${epCode}: ${episode.name} — Nextflix`;
    const description = episode.overview
      ? episode.overview.slice(0, 155) +
        (episode.overview.length > 155 ? "…" : "")
      : `${series.name} — ${epCode}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.episode",
        siteName: "Nextflix",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: t("metaEpisodeFallback") };
  }
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<EpisodePageParams>;
}) {
  const { id, seasonEpisode, locale } = await params;

  const parsed = parseSeasonEpisode(seasonEpisode);
  if (!parsed) notFound();

  const { season: seasonNum, episode: epNum } = parsed;
  const t = await getTranslations("detail");

  let series: SeriesDetails;
  let episode: EpisodeDetails;
  try {
    [series, episode] = await Promise.all([
      getSeriesDetails(id) as Promise<SeriesDetails>,
      getEpisodeDetails(id, seasonNum, epNum),
    ]);
  } catch {
    notFound();
  }

  const guestStars: GuestStar[] =
    episode.guest_stars ?? episode.credits?.guest_stars ?? [];
  const epCrew: CrewMember[] = episode.crew ?? episode.credits?.crew ?? [];

  const mainCast: CastMember[] = series.credits?.cast ?? [];

  type CombinedCast = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    credit_id: string;
    isGuest: boolean;
  };
  const seenIds = new Set<number>();
  const combinedCast: CombinedCast[] = [];
  for (const c of mainCast) {
    if (seenIds.has(c.id)) continue;
    seenIds.add(c.id);
    combinedCast.push({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
      credit_id: c.credit_id,
      isGuest: false,
    });
  }
  for (const g of guestStars) {
    if (seenIds.has(g.id)) continue;
    seenIds.add(g.id);
    combinedCast.push({
      id: g.id,
      name: g.name,
      character: g.character,
      profile_path: g.profile_path,
      credit_id: g.credit_id,
      isGuest: true,
    });
  }

  const directors = epCrew
    .filter((c) => c.job === "Director")
    .map((c) => c.name);
  const writers = epCrew
    .filter(
      (c) =>
        c.department === "Writing" ||
        c.job === "Writer" ||
        c.job === "Screenplay" ||
        c.job === "Story",
    )
    .map((c) => c.name);

  const episodeVideos = (episode.videos?.results ?? []).filter(
    (v) => v.site === "YouTube",
  );

  const allStills = episode.images?.stills ?? [];

  const posterStillPath = episode.still_path;

  const heroAlternativeStill = allStills.find(
    (img) => img.file_path !== posterStillPath,
  );
  const heroStillPath =
    heroAlternativeStill?.file_path ?? episode.still_path ?? null;

  const stills = allStills;

  const validSeasons: Season[] = (series.seasons ?? [])
    .filter((s) => s.season_number > 0 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);

  const currentSeason: Season | undefined = validSeasons.find(
    (s) => s.season_number === seasonNum,
  );
  const totalEpsInSeason = currentSeason?.episode_count ?? 0;
  const currentSeasonIdx = validSeasons.findIndex(
    (s) => s.season_number === seasonNum,
  );

  let prevHref: string | null = null;
  if (epNum > 1) {
    prevHref = `/series/${series.id}/${seasonNum}x${epNum - 1}`;
  } else if (currentSeasonIdx > 0) {
    const prevSeason = validSeasons[currentSeasonIdx - 1];
    prevHref = `/series/${series.id}/${prevSeason.season_number}x${prevSeason.episode_count}`;
  }

  let nextHref: string | null = null;
  if (epNum < totalEpsInSeason) {
    nextHref = `/series/${series.id}/${seasonNum}x${epNum + 1}`;
  } else if (
    currentSeasonIdx !== -1 &&
    currentSeasonIdx < validSeasons.length - 1
  ) {
    const nextSeason = validSeasons[currentSeasonIdx + 1];
    nextHref = `/series/${series.id}/${nextSeason.season_number}x1`;
  }

  const epCode = `${t("seasonPrefix")}${episode.season_number}E${episode.episode_number}`;
  const heroImg = heroStillPath
    ? `${IMG_BASE}/original${heroStillPath}`
    : series.backdrop_path
      ? backdropUrl(series.backdrop_path)
      : null;

  return (
    <div className="detail-page detail-page--episode">
      {/* Hero con el still del episodio */}
      <div className="detail-hero">
        {heroImg && (
          <FadeImage
            src={heroImg}
            alt={episode.name}
            fill
            className="detail-hero-bg"
            priority
            sizes="100vw"
            skeletonVariant="fill"
          />
        )}
        <div className="detail-hero-gradient" />
      </div>

      <div className="detail-info detail-info--episode">
        {/* Still del episodio */}
        <div className="detail-poster-wrap detail-poster-wrap--episode">
          <FadeImage
            src={
              posterStillPath
                ? `${IMG_BASE}/w780${posterStillPath}`
                : posterUrl(series.poster_path, "lg")
            }
            alt={episode.name}
            fill
            className="detail-poster"
            sizes="(max-width: 768px) 320px, (max-width: 1024px) 420px, 520px"
            priority
          />
        </div>

        <div className="detail-details">
          {/* Breadcrumb hacia la serie */}
          <nav className="detail-breadcrumb" aria-label="breadcrumb">
            <Link
              href={`/series/${series.id}`}
              className="detail-breadcrumb__link"
            >
              {series.name}
            </Link>
            <span className="detail-breadcrumb__sep" aria-hidden="true">
              ›
            </span>
            <span className="detail-breadcrumb__current">
              {t("seasonPrefix")}
              {episode.season_number}
            </span>
          </nav>

          <div className="detail-title-row">
            <h1 className="detail-title">{episode.name}</h1>
          </div>

          <div className="detail-meta">
            <span className="detail-type-badge detail-type-badge--episode">
              {epCode}
            </span>
            {episode.vote_average > 0 && (
              <span className="detail-rating">
                <StarRateRoundedIcon />
                {episode.vote_average.toFixed(1)}
              </span>
            )}
            {episode.air_date && (
              <span className="detail-year">
                {formatLocalizedDate(episode.air_date, locale)}
              </span>
            )}
            {episode.runtime ? (
              <span className="detail-runtime">{episode.runtime} min</span>
            ) : null}
          </div>

          {(directors.length > 0 || writers.length > 0) && (
            <div className="detail-ep-crew-summary">
              {directors.length > 0 && (
                <div className="detail-ep-crew-row">
                  <span className="detail-ep-crew-label">
                    {t("factDirector")}:
                  </span>
                  <span className="detail-ep-crew-value">
                    {directors.join(", ")}
                  </span>
                </div>
              )}
              {writers.length > 0 && (
                <div className="detail-ep-crew-row">
                  <span className="detail-ep-crew-label">
                    {t("factWriter")}:
                  </span>
                  <span className="detail-ep-crew-value">
                    {writers.slice(0, 4).join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {episode.overview && (
            <p className="detail-overview">{episode.overview}</p>
          )}

          {/* Navegación prev / next episodio*/}
          <div className="detail-episode-nav">
            {prevHref ? (
              <Link href={prevHref} className="detail-episode-nav__btn">
                <ArrowBackIosRoundedIcon fontSize="small" />
                <span>{t("prevEpisode")}</span>
              </Link>
            ) : (
              <span className="detail-episode-nav__btn detail-episode-nav__btn--disabled">
                <ArrowBackIosRoundedIcon fontSize="small" />
                <span>{t("prevEpisode")}</span>
              </span>
            )}
            <Link
              href={`/series/${series.id}`}
              className="detail-episode-nav__btn detail-episode-nav__btn--center"
            >
              {t("backToSeries")}
            </Link>
            {nextHref ? (
              <Link href={nextHref} className="detail-episode-nav__btn">
                <span>{t("nextEpisodeNav")}</span>
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </Link>
            ) : (
              <span className="detail-episode-nav__btn detail-episode-nav__btn--disabled">
                <span>{t("nextEpisodeNav")}</span>
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reparto */}
      {combinedCast.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">{t("cast")}</h3>
          <CastCarousel>
            {combinedCast.slice(0, 30).map((actor) => (
              <Link
                key={actor.credit_id}
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

      {/* Videos del episodio (YouTube) */}
      {episodeVideos.length > 0 && (
        <div className="detail-section">
          <VideoGrid videos={episodeVideos} title={t("episodeVideos")} />
        </div>
      )}

      {/* Galería de stills adicionales */}
      {stills.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">{t("episodeStills")}</h3>
          <EpisodeStills stills={stills} episodeName={episode.name} />
        </div>
      )}

      <div style={{ height: "4rem" }} />
    </div>
  );
}
