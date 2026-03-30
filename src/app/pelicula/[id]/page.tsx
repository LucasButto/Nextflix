import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieDetails } from "@/services/movies";
import { posterUrl, backdropUrl, profileUrl, IMG_BASE } from "@/services/tmdb";
import WatchlistButton from "@/components/shared/WatchlistButton/WatchlistButton";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
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
  const providers =
    movie["watch/providers"]?.results?.AR?.flatrate ??
    movie["watch/providers"]?.results?.US?.flatrate ??
    [];
  const similar = movie.similar?.results?.slice(0, 15) ?? [];
  const recommendations = movie.recommendations?.results?.slice(0, 15) ?? [];
  const year = (movie.release_date ?? "").slice(0, 4);
  const hours = Math.floor((movie.runtime ?? 0) / 60);
  const mins = (movie.runtime ?? 0) % 60;

  return (
    <div className="detail-page">
      <div className="detail-hero">
        {movie.backdrop_path && (
          <Image
            src={backdropUrl(movie.backdrop_path)!}
            alt={movie.title}
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
            {year && <span className="detail-year">({year})</span>}
          </div>
          <div className="detail-meta-row">
            {movie.vote_average > 0 && (
              <span className="detail-rating">
                <StarRateRoundedIcon />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
            {movie.runtime > 0 && (
              <span className="detail-runtime">
                {hours > 0 && `${hours}h `}
                {mins}min
              </span>
            )}
          </div>
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

      {similar.length > 0 && (
        <Carousel title="Similares">
          {similar.map((m: Movie) => (
            <MediaCard key={m.id} item={m} mediaType="movie" />
          ))}
        </Carousel>
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
