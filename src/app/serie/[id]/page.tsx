import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeriesDetails } from "@/services/series";
import { posterUrl, backdropUrl, profileUrl, IMG_BASE } from "@/services/tmdb";
import WatchlistButton from "@/components/shared/WatchlistButton/WatchlistButton";
import SeasonEpisodes from "@/components/series/SeasonEpisodes/SeasonEpisodes";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import type {
  SeriesDetails,
  CastMember,
  StreamingProvider,
  Series,
  PageParams,
} from "@/types/tmdb";

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  try {
    const series = (await getSeriesDetails(id)) as SeriesDetails;
    return { title: `${series.name} — Nextflix` };
  } catch {
    return { title: "Serie — Nextflix" };
  }
}

export default async function SerieDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  let series: SeriesDetails;
  try {
    series = (await getSeriesDetails(id)) as SeriesDetails;
  } catch {
    notFound();
  }

  const cast = series.credits?.cast?.slice(0, 20) ?? [];
  const providers =
    series["watch/providers"]?.results?.AR?.flatrate ??
    series["watch/providers"]?.results?.US?.flatrate ??
    [];
  const similar = series.similar?.results?.slice(0, 15) ?? [];
  const recommendations = series.recommendations?.results?.slice(0, 15) ?? [];
  const year = (series.first_air_date ?? "").slice(0, 4);
  const lastYear = (series.last_air_date ?? "").slice(0, 4);
  const yearDisplay =
    lastYear && lastYear !== year ? `${year}–${lastYear}` : year;
  const totalSeasons = series.number_of_seasons ?? 0;

  const statusLabel =
    series.status === "Returning Series"
      ? "En emisión"
      : series.status === "Ended"
        ? "Finalizada"
        : series.status === "Canceled"
          ? "Cancelada"
          : series.status;
  const statusColor =
    series.status === "Returning Series" ? "#46d369" : "#b3b3b3";

  return (
    <div className="detail-page">
      <div className="detail-hero">
        {series.backdrop_path && (
          <Image
            src={backdropUrl(series.backdrop_path)!}
            alt={series.name}
            fill
            priority
            className="detail-hero-bg"
            sizes="100vw"
          />
        )}
        <div className="detail-hero-gradient" />
      </div>

      <div className="detail-info">
        <div className="detail-poster-wrap">
          <Image
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
            {yearDisplay && (
              <span className="detail-year">({yearDisplay})</span>
            )}
          </div>
          <div className="detail-meta-row">
            {series.vote_average > 0 && (
              <span className="detail-rating">
                <StarRateRoundedIcon />
                {series.vote_average.toFixed(1)}
              </span>
            )}
            {totalSeasons > 0 && (
              <span className="detail-seasons-badge">
                {totalSeasons} temporada{totalSeasons !== 1 ? "s" : ""}
              </span>
            )}
            {series.episode_run_time?.[0] && (
              <span className="detail-runtime">
                ~{series.episode_run_time[0]} min/ep
              </span>
            )}
            <span className="detail-runtime" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>
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
          </div>
        </div>
      </div>

      {providers.length > 0 && (
        <div className="detail-providers-section">
          <h3 className="section-title">Dónde ver</h3>
          <div className="detail-providers-list">
            {providers.map((p: StreamingProvider) => (
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
            ))}
          </div>
        </div>
      )}

      {cast.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">Reparto</h3>
          <div className="detail-cast-grid">
            {cast.map((actor: CastMember) => (
              <Link
                key={actor.id}
                href={`/actor/${actor.id}`}
                className="detail-cast-card"
              >
                <Image
                  src={profileUrl(actor.profile_path, "sm")}
                  alt={actor.name}
                  width={100}
                  height={100}
                  className="detail-cast-img"
                />
                <p className="detail-cast-name">{actor.name}</p>
                <p className="detail-cast-char">{actor.character}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {series.seasons?.length > 0 && (
        <SeasonEpisodes seriesId={series.id} seasons={series.seasons} />
      )}

      {similar.length > 0 && (
        <Carousel title="Series Similares">
          {similar.map((s: Series) => (
            <MediaCard key={s.id} item={s} mediaType="tv" />
          ))}
        </Carousel>
      )}
      {recommendations.length > 0 && (
        <Carousel title="Recomendaciones">
          {recommendations.map((s: Series) => (
            <MediaCard key={s.id} item={s} mediaType="tv" />
          ))}
        </Carousel>
      )}
      <div style={{ height: "4rem" }} />
    </div>
  );
}
