import { getTranslations } from "next-intl/server";
import Carousel from "@/components/shared/Carousel/Carousel";
import MediaCard from "@/components/shared/MediaCard/MediaCard";
import Top100PickerButton from "@/components/shared/RandomPicker/Top100PickerButton/Top100PickerButton";
import {
  getSeriesByGenre,
  getTrendingSeries,
  getTop100SeriesEnhanced,
  getAnimeSeries,
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

  const [trending, top100, anime, genreList, genreResults] = await Promise.all([
    getTrendingSeries("week").catch(() => []) as Promise<Series[]>,
    getTop100SeriesEnhanced().catch(() => []) as Promise<Series[]>,
    getAnimeSeries().catch(() => []) as Promise<Series[]>,
    getTVGenreList(),
    Promise.all(
      TV_GENRE_IDS.map(async (id) => ({
        id,
        series: (await getSeriesByGenre(id).catch(() => [])) as Series[],
      })),
    ),
  ]);

  const genreNameMap = new Map(genreList.map((g) => [g.id, g.name]));
  const activeGenres = genreResults
    .filter((g) => g.series.length > 0)
    .map((g) => ({ ...g, name: genreNameMap.get(g.id) ?? "" }))
    .filter((g) => g.name);

  if (anime.length > 0) {
    const animationIdx = activeGenres.findIndex((g) => g.id === 16);
    const insertAt = animationIdx >= 0 ? animationIdx + 1 : activeGenres.length;
    activeGenres.splice(insertAt, 0, { id: -1, name: "Anime", series: anime });
  }

  const top100PickerItems = top100.map((s) => ({
    id: s.id,
    media_type: "tv" as const,
    title: s.name,
    poster_path: s.poster_path,
    vote_average: s.imdb_rating ?? s.vote_average,
  }));

  return (
    <div style={{ paddingTop: "2rem" }}>
      <Carousel title={t("trendingWeek")}>
        {trending.slice(0, 20).map((s: Series) => (
          <MediaCard key={s.id} item={s} mediaType="tv" variant="wide" />
        ))}
      </Carousel>
      <Carousel
        title={t("top100")}
        headerAction={<Top100PickerButton items={top100PickerItems} />}
      >
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
