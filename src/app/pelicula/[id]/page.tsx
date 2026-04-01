import Image from "next/image";
import { notFound } from "next/navigation";
import { getMovieDetails, getCollectionDetails } from "@/services/movies";
import { posterUrl, backdropUrl, profileUrl, IMG_BASE } from "@/services/tmdb";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import WatchlistButton from "@/components/shared/WatchlistButton/WatchlistButton";
import WatchedButton from "@/components/shared/WatchedButton/WatchedButton";
import Carousel from "@/components/shared/Carousel/Carousel";
import CastCarousel from "@/components/shared/CastCarousel/CastCarousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import TransitionLink from "@/components/layout/TransitionLink/TransitionLink";
import { formatSpanishDate, isUpcoming, extractYear } from "@/utils/dates";
import { formatRuntime } from "@/utils/format";
import { getProviders, getTrailerKey } from "@/utils/media";
import TrailerPlayer from "@/components/shared/TrailerPlayer/TrailerPlayer";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import type {
  MovieDetails,
  CastMember,
  StreamingProvider,
  Movie,
  PageParams,
} from "@/types/tmdb";

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  try {
    const movie = (await getMovieDetails(id)) as MovieDetails;
    return { title: `${movie.title} — Nextflix` };
  } catch {
    return { title: "Película — Nextflix" };
  }
}

export default async function PeliculaDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  let movie: MovieDetails;
  try {
    movie = (await getMovieDetails(id)) as MovieDetails;
  } catch {
    notFound();
  }

  const cast = movie.credits?.cast?.slice(0, 20) ?? [];
  const providers = getProviders(movie);
  const trailerKey = getTrailerKey(movie.videos);
  const year = extractYear(movie.release_date);
  const runtime = formatRuntime(movie.runtime ?? 0);
  const upcoming = isUpcoming(movie.release_date);

  /* ── Recomendaciones: priorizar películas de la misma colección ─────── */
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
    } catch {
      // Si falla el fetch de la colección, seguimos sin ella
    }
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
              Película
            </span>
            {movie.vote_average > 0 && (
              <span className="detail-rating">
                <StarRateRoundedIcon />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
            {year && <span className="detail-year">{year}</span>}
            {runtime && <span className="detail-runtime">{runtime}</span>}
          </div>

          {/* ── Próximo estreno ── */}
          {upcoming && movie.release_date && (
            <div className="detail-upcoming-release">
              <span className="detail-upcoming-release__label">
                Próximo estreno
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

      {trailerKey && (
        <div className="detail-section">
          <h3 className="section-title">Trailer</h3>
          <TrailerPlayer videoKey={trailerKey} title={movie.title} />
        </div>
      )}

      {cast.length > 0 && (
        <div className="detail-section">
          <h3 className="section-title">Reparto</h3>
          <CastCarousel>
            {cast.map((actor: CastMember) => (
              <TransitionLink
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
              </TransitionLink>
            ))}
          </CastCarousel>
        </div>
      )}

      {recommendations.length > 0 && (
        <Carousel title="Recomendaciones">
          {recommendations.map((m: Movie) => (
            <MediaCard key={m.id} item={m} mediaType="movie" />
          ))}
        </Carousel>
      )}

      <div style={{ height: "4rem" }} />
    </div>
  );
}
