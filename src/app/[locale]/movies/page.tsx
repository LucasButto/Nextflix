import { getTranslations } from "next-intl/server";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import {
  getMoviesByGenre,
  getTrendingMovies,
  getTop100Movies,
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

  const [trending, top100, genreList, genreResults] = await Promise.all([
    getTrendingMovies("week").catch(() => []) as Promise<Movie[]>,
    getTop100Movies().catch(() => []) as Promise<Movie[]>,
    getMovieGenreList(),
    Promise.all(
      MOVIE_GENRE_IDS.map(async (id) => ({
        id,
        movies: (await getMoviesByGenre(id).catch(() => [])) as Movie[],
      })),
    ),
  ]);

  // Combinar IDs con nombres traducidos de la API
  const genreNameMap = new Map(genreList.map((g) => [g.id, g.name]));
  const activeGenres = genreResults
    .filter((g) => g.movies.length > 0)
    .map((g) => ({ ...g, name: genreNameMap.get(g.id) ?? "" }))
    .filter((g) => g.name);

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title={t("trendingWeek")}>
        {trending.slice(0, 20).map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" variant="wide" />
        ))}
      </Carousel>
      <Carousel title={t("top100")}>
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
