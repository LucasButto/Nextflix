import { getTranslations } from "next-intl/server";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import Top100PickerButton from "@/components/shared/RandomPicker/Top100PickerButton/Top100PickerButton";
import {
  getMoviesByGenre,
  getTrendingMovies,
  getTop100MoviesEnhanced,
  getAnimeMovies,
  getMovieGenreList,
} from "@/services/movies";
import { MOVIE_GENRE_IDS } from "@/services/tmdb";
import type { Movie } from "@/types/tmdb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "movies" });
  return { title: t("metaTitle") };
}

export default async function PeliculasPage() {
  const t = await getTranslations("movies");

  const [trending, top100, anime, genreList, genreResults] = await Promise.all([
    getTrendingMovies("week").catch(() => []) as Promise<Movie[]>,
    getTop100MoviesEnhanced().catch(() => []) as Promise<Movie[]>,
    getAnimeMovies().catch(() => []) as Promise<Movie[]>,
    getMovieGenreList(),
    Promise.all(
      MOVIE_GENRE_IDS.map(async (id) => ({
        id,
        movies: (await getMoviesByGenre(id).catch(() => [])) as Movie[],
      })),
    ),
  ]);

  const genreNameMap = new Map(genreList.map((g) => [g.id, g.name]));
  const activeGenres = genreResults
    .filter((g) => g.movies.length > 0)
    .map((g) => ({ ...g, name: genreNameMap.get(g.id) ?? "" }))
    .filter((g) => g.name);

  if (anime.length > 0) {
    const animationIdx = activeGenres.findIndex((g) => g.id === 16);
    const insertAt = animationIdx >= 0 ? animationIdx + 1 : activeGenres.length;
    activeGenres.splice(insertAt, 0, { id: -1, name: "Anime", movies: anime });
  }

  const top100PickerItems = top100.map((m) => ({
    id: m.id,
    media_type: "movie" as const,
    title: m.title,
    poster_path: m.poster_path,
    vote_average: m.imdb_rating ?? m.vote_average,
  }));

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title={t("trendingWeek")}>
        {trending.slice(0, 20).map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" variant="wide" />
        ))}
      </Carousel>
      <Carousel
        title={t("top100")}
        headerAction={<Top100PickerButton items={top100PickerItems} />}
      >
        {top100.map((m: Movie, i: number) => (
          <MediaCard
            key={m.id}
            item={m}
            mediaType="movie"
            rank={i + 1}
            variant="top10"
            smallRank
          />
        ))}
      </Carousel>
      {activeGenres.map((genre) => (
        <Carousel key={genre.id} title={genre.name}>
          {genre.movies.map((m: Movie) => (
            <MediaCard key={m.id} item={m} mediaType="movie" />
          ))}
        </Carousel>
      ))}
      <div style={{ height: "4rem" }} />
    </div>
  );
}
