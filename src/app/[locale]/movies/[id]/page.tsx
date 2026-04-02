import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMovieDetails, getCollectionDetails } from "@/services/movies";
import { posterUrl, backdropUrl, profileUrl, IMG_BASE } from "@/services/tmdb";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import WatchlistButton from "@/components/shared/WatchlistButton/WatchlistButton";
import WatchedButton from "@/components/shared/WatchedButton/WatchedButton";
import Carousel from "@/components/shared/Carousel/Carousel";
import CastCarousel from "@/components/shared/CastCarousel/CastCarousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import TrailerPlayer from "@/components/shared/TrailerPlayer/TrailerPlayer";
import { Link } from "@/navigation";
import {
  formatSpanishDate,
  isUpcoming,
  isToday,
  extractYear,
} from "@/utils/dates";
import { formatRuntime } from "@/utils/format";
import { getProviders, getTrailerKey, getCertification } from "@/utils/media";
import { getUserTimezone } from "@/utils/timezone";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import type {
  MovieDetails,
  CastMember,
  StreamingProvider,
  Movie,
} from "@/types/tmdb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "detail" });
  try {
    const movie = (await getMovieDetails(id)) as MovieDetails;
    const title = `${movie.title} — Nextflix`;
    const description = movie.overview?.slice(0, 200) ?? title;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.movie",
        siteName: "Nextflix",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: t("metaMovieFallback") };
  }
}

export default async function PeliculaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const [t, tz] = await Promise.all([
    getTranslations("detail"),
    getUserTimezone(),
  ]);

  let movie: MovieDetails;
  try {
    movie = (await getMovieDetails(id)) as MovieDetails;
  } catch {
    notFound();
  }

  const cast = movie.credits?.cast?.slice(0, 20) ?? [];
  const providers = getProviders(movie);
  const trailerKey = getTrailerKey(movie.videos);
  const certification = getCertification(movie);
  const year = extractYear(movie.release_date);
  const runtime = formatRuntime(movie.runtime ?? 0);
  const upcoming = isUpcoming(movie.release_date, tz);
  const todayRelease = isToday(movie.release_date, tz);

  let collectionMovies: Movie[] = [];
  if (movie.belongs_to_collection) {
    try {
      const collection = await getCollectionDetails(
        movie.belongs_to_collection.id,
      );
      collectionMovies = (collection.parts ?? [])
        .filter((m) => m.id !== movie.id)
        .sort(
          (a, b) =>
            new Date(a.release_date ?? "").getTime() -
            new Date(b.release_date ?? "").getTime(),
        );
    } catch {}
  }

  const regularRecs = movie.recommendations?.results ?? [];
  const collectionIds = new Set(collectionMovies.map((m) => m.id));
  const filteredRecs = regularRecs.filter((m) => !collectionIds.has(m.id));
  const recommendations = [...collectionMovies, ...filteredRecs].slice(0, 15);

  return (
    <div className="detail-page">
      <div className="detail-hero">
        {movie.backdrop_path && (
          <FadeImage
            src={backdropUrl(movie.backdrop_path)!}
            alt={movie.title}
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
            src={posterUrl(movie.poster_path, "lg")}
            alt={movie.title}
            width={300}
            height={450}
            className="detail-poster"
            priority
          />
        </div>
        <div className="detail-details">
          <div className="detail-title-row">
            <h1 className="detail-title">{movie.title}</h1>
            {movie.tagline && (
              <span className="detail-tagline">{movie.tagline}</span>
            )}
          </div>
          <div className="detail-meta">
            <span className="detail-type-badge detail-type-badge--movie">
              {t("movie")}
            </span>
            {certification && (
              <span className="detail-certification">{certification}</span>
            )}
            {movie.vote_average > 0 && (
              <span className="detail-rating">
                <StarRateRoundedIcon />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
            {year && <span className="detail-year">{year}</span>}
            {runtime && <span className="detail-runtime">{runtime}</span>}
          </div>

          {upcoming && movie.release_date && (
            <div
              className={`detail-upcoming-release${todayRelease ? " detail-upcoming-release--today" : ""}`}
            >
              <span className="detail-upcoming-release__label">
                {todayRelease ? t("upcomingToday") : t("upcoming")}
              </span>
              <span
                className="detail-upcoming-release__divider"
                aria-hidden="true"
              >
                /
              </span>
              <span className="detail-upcoming-release__date">
                {formatSpanishDate(movie.release_date)}
              </span>
            </div>
          )}

          <div className="detail-genres">
            {movie.genres?.map((g) => (
              <span key={g.id} className="genre-tag">
                {g.name}
              </span>
            ))}
          </div>
          {movie.overview && (
            <p className="detail-overview">{movie.overview}</p>
          )}
          <div className="detail-actions">
            <WatchlistButton item={movie} mediaType="movie" />
            <WatchedButton item={movie} mediaType="movie" />
          </div>
        </div>
      </div>

      {providers.length > 0 && (
        <div className="detail-providers-section">
          <h3 className="section-title">{t("whereToWatch")}</h3>
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
          <TrailerPlayer videoKey={trailerKey} title={movie.title} />
        </div>
      )}

      {recommendations.length > 0 && (
        <Carousel title={t("recommendations")}>
          {recommendations.map((m: Movie) => (
            <MediaCard key={m.id} item={m} mediaType="movie" />
          ))}
        </Carousel>
      )}

      <div style={{ height: "4rem" }} />
    </div>
  );
}
