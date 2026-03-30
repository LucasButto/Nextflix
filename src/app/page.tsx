import HeroBanner from "@/components/home/HeroBanner/HeroBanner";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
} from "@/services/movies";
import {
  getTrendingSeries,
  getPopularSeries,
  getTopRatedSeries,
} from "@/services/series";
import type { Movie, Series } from "@/types/tmdb";

export default async function HomePage() {
  const [
    trendingMovies,
    trendingSeries,
    popularMovies,
    topRatedMovies,
    nowPlaying,
    popularSeries,
    topRatedSeries,
  ] = await Promise.all([
    getTrendingMovies("day").catch(() => []) as Promise<Movie[]>,
    getTrendingSeries("day").catch(() => []) as Promise<Series[]>,
    getPopularMovies().catch(() => []) as Promise<Movie[]>,
    getTopRatedMovies().catch(() => []) as Promise<Movie[]>,
    getNowPlayingMovies().catch(() => []) as Promise<Movie[]>,
    getPopularSeries().catch(() => []) as Promise<Series[]>,
    getTopRatedSeries().catch(() => []) as Promise<Series[]>,
  ]);

  const heroItems = [
    ...trendingMovies.slice(0, 3),
    ...trendingSeries.slice(0, 2),
  ]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5);

  return (
    <>
      <HeroBanner items={heroItems} />
      <Carousel title="Top 10 Películas de Hoy">
        {trendingMovies.slice(0, 10).map((m: Movie, i: number) => (
          <MediaCard
            key={m.id}
            item={m}
            mediaType="movie"
            rank={i + 1}
            variant="top10"
          />
        ))}
      </Carousel>
      <Carousel title="Top 10 Series de Hoy">
        {trendingSeries.slice(0, 10).map((s: Series, i: number) => (
          <MediaCard
            key={s.id}
            item={s}
            mediaType="tv"
            rank={i + 1}
            variant="top10"
          />
        ))}
      </Carousel>
      <Carousel title="Películas Populares">
        {popularMovies.map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" />
        ))}
      </Carousel>
      <Carousel title="En Cartelera">
        {nowPlaying.map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" variant="wide" />
        ))}
      </Carousel>
      <Carousel title="Series Populares">
        {popularSeries.map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" />
        ))}
      </Carousel>
      <Carousel title="Mejor Valoradas — Películas">
        {topRatedMovies.map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" />
        ))}
      </Carousel>
      <Carousel title="Mejor Valoradas — Series">
        {topRatedSeries.map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" />
        ))}
      </Carousel>
      <div style={{ height: "4rem" }} />
    </>
  );
}
