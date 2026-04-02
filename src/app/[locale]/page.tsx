import { getTranslations } from "next-intl/server";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("metaTitle"), description: t("metaDesc") };
}

export default async function HomePage() {
  const t = await getTranslations("home");

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
      <Carousel title={t("top10Movies")}>
        {[...trendingMovies.slice(0, 10)]
          .sort((a, b) => b.vote_average - a.vote_average)
          .map((m: Movie, i: number) => (
            <MediaCard
              key={m.id}
              item={m}
              mediaType="movie"
              rank={i + 1}
              variant="top10"
            />
          ))}
      </Carousel>
      <Carousel title={t("top10Series")}>
        {[...trendingSeries.slice(0, 10)]
          .sort((a, b) => b.vote_average - a.vote_average)
          .map((s: Series, i: number) => (
            <MediaCard
              key={s.id}
              item={s}
              mediaType="tv"
              rank={i + 1}
              variant="top10"
            />
          ))}
      </Carousel>
      <Carousel title={t("nowPlaying")}>
        {nowPlaying.map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" variant="wide" />
        ))}
      </Carousel>
      <Carousel title={t("popularMovies")}>
        {popularMovies.map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" />
        ))}
      </Carousel>
      <Carousel title={t("popularSeries")}>
        {popularSeries.map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" />
        ))}
      </Carousel>
      <Carousel title={t("topRatedMovies")}>
        {topRatedMovies.map((m: Movie) => (
          <MediaCard key={m.id} item={m} mediaType="movie" />
        ))}
      </Carousel>
      <Carousel title={t("topRatedSeries")}>
        {topRatedSeries.map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" />
        ))}
      </Carousel>
      <div style={{ height: "4rem" }} />
    </>
  );
}
