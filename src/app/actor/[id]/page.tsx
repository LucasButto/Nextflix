import Image from "next/image";
import { notFound } from "next/navigation";
import { getActorDetails } from "@/services/actors";
import { profileUrl } from "@/services/tmdb";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import type { ActorDetails, Movie, Series, PageParams } from "@/types/tmdb";
import "./actor.scss";

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  try {
    const actor = (await getActorDetails(id)) as ActorDetails;
    return { title: `${actor.name} — Nextflix` };
  } catch {
    return { title: "Actor — Nextflix" };
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ActorPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  let actor: ActorDetails;
  try {
    actor = (await getActorDetails(id)) as ActorDetails;
  } catch {
    notFound();
  }

  const movies = [...(actor.movie_credits?.cast ?? [])]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20);

  const tvShows = [...(actor.tv_credits?.cast ?? [])]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20);

  const birth = actor.birthday;
  const death = actor.deathday;
  const age =
    birth && !death
      ? Math.floor(
          new Date().getFullYear() -
            new Date(birth + "T00:00:00").getFullYear(),
        )
      : null;

  return (
    <div className="actor-page">
      <div className="actor-header">
        <div className="actor-photo-wrap">
          <Image
            src={profileUrl(actor.profile_path, "lg")}
            alt={actor.name}
            width={300}
            height={450}
            className="actor-photo"
            priority
          />
        </div>
        <div className="actor-bio">
          <h1 className="actor-name">{actor.name}</h1>
          <div className="actor-facts">
            {birth && (
              <div className="actor-fact">
                <span className="actor-fact__label">Nacimiento</span>
                <span>
                  {formatDate(birth)}
                  {age ? ` (${age} años)` : ""}
                </span>
              </div>
            )}
            {death && (
              <div className="actor-fact">
                <span className="actor-fact__label">Fallecimiento</span>
                <span>{formatDate(death)}</span>
              </div>
            )}
            {actor.place_of_birth && (
              <div className="actor-fact">
                <span className="actor-fact__label">Lugar</span>
                <span>{actor.place_of_birth}</span>
              </div>
            )}
            {actor.known_for_department && (
              <div className="actor-fact">
                <span className="actor-fact__label">Conocido por</span>
                <span>{actor.known_for_department}</span>
              </div>
            )}
          </div>
          {actor.biography && (
            <p className="actor-biography">{actor.biography}</p>
          )}
        </div>
      </div>

      {movies.length > 0 && (
        <Carousel title="Filmografía — Películas">
          {movies.map((m: Movie & { credit_id: string }) => (
            <MediaCard
              key={`m-${m.id}-${m.credit_id}`}
              item={m}
              mediaType="movie"
            />
          ))}
        </Carousel>
      )}
      {tvShows.length > 0 && (
        <Carousel title="Filmografía — Series">
          {tvShows.map((s: Series & { credit_id: string }) => (
            <MediaCard
              key={`t-${s.id}-${s.credit_id}`}
              item={s}
              mediaType="tv"
            />
          ))}
        </Carousel>
      )}
      <div style={{ height: "4rem" }} />
    </div>
  );
}
