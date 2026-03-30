import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import { getSeriesByGenre, getTrendingSeries } from "@/services/series";
import { TV_GENRES } from "@/services/tmdb";
import type { Series } from "@/types/tmdb";

export const metadata = { title: "Series — Nextflix" };

export default async function SeriesPage() {
  const trending = (await getTrendingSeries("week").catch(
    () => [],
  )) as Series[];
  const genreResults = await Promise.all(
    TV_GENRES.map(async (genre) => ({
      ...genre,
      series: (await getSeriesByGenre(genre.id).catch(() => [])) as Series[],
    })),
  );
  const activeGenres = genreResults.filter((g) => g.series.length > 0);

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title="Series en Tendencia">
        {trending.slice(0, 20).map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" variant="wide" />
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
