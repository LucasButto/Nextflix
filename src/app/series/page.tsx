import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import {
  getSeriesByGenre,
  getTrendingSeries,
  getTop100Series,
} from "@/services/series";
import { TV_GENRES } from "@/services/tmdb";
import type { Series } from "@/types/tmdb";

export const metadata = { title: "Series — Nextflix" };

export default async function SeriesPage() {
  const [trending, top100, genreResults] = await Promise.all([
    getTrendingSeries("week").catch(() => []) as Promise<Series[]>,
    getTop100Series().catch(() => []) as Promise<Series[]>,
    Promise.all(
      TV_GENRES.map(async (genre) => ({
        ...genre,
        series: (await getSeriesByGenre(genre.id).catch(() => [])) as Series[],
      })),
    ),
  ]);
  const activeGenres = genreResults.filter((g) => g.series.length > 0);

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title="Series en Tendencia">
        {trending.slice(0, 20).map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" variant="wide" />
        ))}
      </Carousel>
      <Carousel title="Top 100 Series — Mejor Valoradas">
        {top100.map((s: Series, i: number) => (
          <MediaCard
            key={s.id}
            item={s}
            mediaType="tv"
            rank={i + 1}
            variant="top10"
            smallRank
          />
        ))}
      </Carousel>
      {activeGenres.map((genre) => (
        <Carousel key={genre.id} title={genre.name}>
          {genre.series.map((s: Series) => (
            <MediaCard key={s.id} item={s} mediaType="tv" />
          ))}
        </Carousel>
      ))}
      <div style={{ height: "4rem" }} />
    </div>
  );
}
