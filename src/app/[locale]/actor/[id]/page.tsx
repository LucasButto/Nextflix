import { getTranslations } from "next-intl/server";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { notFound } from "next/navigation";
import { getActorDetails } from "@/services/actors";
import { profileUrl } from "@/services/tmdb";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import { formatDate, calculateAge } from "@/utils/dates";
import type { ActorDetails, Movie, Series } from "@/types/tmdb";
import "@/styles/pages/actor/actor.scss";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "actor" });
  try {
    const actor = (await getActorDetails(id)) as ActorDetails;
    return { title: `${actor.name} — Nextflix` };
  } catch {
    return { title: t("metaFallback") };
  }
}

export default async function ActorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("actor");

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

  const age = calculateAge(actor.birthday, actor.deathday);

  return (
    <div className="actor-page">
      <div className="actor-header">
        <div className="actor-photo-wrap">
          <FadeImage
            src={profileUrl(actor.profile_path, "lg")}
            alt={actor.name}
            fill
            className="actor-photo"
            priority
          />
        </div>
        <div className="actor-bio">
          <h1 className="actor-name">{actor.name}</h1>
          <div className="actor-facts">
            {actor.birthday && (
              <div className="actor-fact">
                <span className="actor-fact__label">{t("born")}</span>
                <span>
                  {formatDate(actor.birthday)}
                  {age ? ` (${t("years", { count: age })})` : ""}
                </span>
              </div>
            )}
            {actor.deathday && (
              <div className="actor-fact">
                <span className="actor-fact__label">{t("died")}</span>
                <span>{formatDate(actor.deathday)}</span>
              </div>
            )}
            {actor.place_of_birth && (
              <div className="actor-fact">
                <span className="actor-fact__label">{t("birthplace")}</span>
                <span>{actor.place_of_birth}</span>
              </div>
            )}
            {actor.known_for_department && (
              <div className="actor-fact">
                <span className="actor-fact__label">{t("knownFor")}</span>
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
        <Carousel title={t("filmographyMovies")}>
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
        <Carousel title={t("filmographySeries")}>
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
