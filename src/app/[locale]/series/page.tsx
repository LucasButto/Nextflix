import { getTranslations } from "next-intl/server";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import {
  getSeriesByGenre,
  getTrendingSeries,
  getTop100Series,
  getTVGenreList,
} from "@/services/series";
import { TV_GENRE_IDS } from "@/services/tmdb";
import type { Series } from "@/types/tmdb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "series" });
  return { title: t("metaTitle") };
}

export default async function SeriesPage() {
  const t = await getTranslations("series");

  const [trending, top100, genreList, genreResults] = await Promise.all([
    getTrendingSeries("week").catch(() => []) as Promise<Series[]>,
    getTop100Series().catch(() => []) as Promise<Series[]>,
    getTVGenreList(),
    Promise.all(
      TV_GENRE_IDS.map(async (id) => ({
        id,
        series: (await getSeriesByGenre(id).catch(() => [])) as Series[],
      })),
    ),
  ]);

  // Combinar IDs con nombres traducidos de la API
  const genreNameMap = new Map(genreList.map((g) => [g.id, g.name]));
  const activeGenres = genreResults
    .filter((g) => g.series.length > 0)
    .map((g) => ({ ...g, name: genreNameMap.get(g.id) ?? "" }))
    .filter((g) => g.name);

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title={t("trendingWeek")}>
        {trending.slice(0, 20).map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" variant="wide" />
        ))}
      </Carousel>
      <Carousel title={t("top100")}>
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
