import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import {
  getMoviesByGenre,
  getTrendingMovies,
  getTop100Movies,
} from "@/services/movies";
import { MOVIE_GENRES } from "@/services/tmdb";
import type { Movie } from "@/types/tmdb";

export const metadata = { title: "Películas — Nextflix" };

export default async function PeliculasPage() {
  const [trending, top100, genreResults] = await Promise.all([
    getTrendingMovies("week").catch(() => []) as Promise<Movie[]>,
    getTop100Movies().catch(() => []) as Promise<Movie[]>,
    Promise.all(
      MOVIE_GENRES.map(async (genre) => ({
        ...genre,
        movies: (await getMoviesByGenre(genre.id).catch(() => [])) as Movie[],
      })),
    ),
  ]);
  const activeGenres = genreResults.filter((g) => g.movies.length > 0);

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title="Tendencia Esta Semana">
        {trending.slice(0, 20).map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" variant="wide" />
        ))}
      </Carousel>
      <Carousel title="Top 100 peliculas — Mejor Valoradas">
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
