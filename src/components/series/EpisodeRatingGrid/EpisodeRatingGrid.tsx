import { getTranslations } from "next-intl/server";
import { getSeasonDetails } from "@/services/series";
import type { Season, SeasonDetails } from "@/types/tmdb";
import EpisodeRatingGridDesktop, {
  type SlimSeason,
} from "./EpisodeRatingGridDesktop/EpisodeRatingGridDesktop";
import EpisodeRatingGridMobile from "./EpisodeRatingGridMobile/EpisodeRatingGridMobile";
import "./EpisodeRatingGrid.scss";

interface EpisodeRatingGridProps {
  seriesId: number;
  seasons: Season[];
  averageLabel: string;
  seasonPrefix: string;
}

const DESKTOP_INITIAL = 8;
const DESKTOP_STEP = 8;
const MOBILE_INITIAL = 10;
const MOBILE_STEP = 10;

function ratingTier(rating: number): string {
  if (rating <= 0) return "egrid__cell--empty";
  if (rating >= 9.5) return "egrid__cell--cinema";
  if (rating >= 9.0) return "egrid__cell--awesome";
  if (rating >= 8.0) return "egrid__cell--great";
  if (rating >= 7.0) return "egrid__cell--good";
  if (rating >= 6.0) return "egrid__cell--regular";
  if (rating >= 5.0) return "egrid__cell--bad";
  return "egrid__cell--garbage";
}

export default async function EpisodeRatingGrid({
  seriesId,
  seasons,
  averageLabel,
  seasonPrefix,
}: EpisodeRatingGridProps) {
  const t = await getTranslations("detail");

  const validSeasons = [...seasons]
    .filter((s) => s.season_number > 0 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);

  if (validSeasons.length === 0) return null;

  const results = await Promise.allSettled(
    validSeasons.map((s) => getSeasonDetails(seriesId, s.season_number)),
  );

  const seasonData: SlimSeason[] = results
    .map((res, i): SlimSeason | null => {
      const season = validSeasons[i];
      if (res.status !== "fulfilled") return null;
      const episodes = (res.value as SeasonDetails).episodes ?? [];
      const lastEpNumber =
        episodes.length > 0
          ? Math.max(...episodes.map((e) => e.episode_number))
          : 0;
      const rated = episodes.filter((e) => e.vote_average > 0);
      const average =
        rated.length > 0
          ? rated.reduce((sum, e) => sum + e.vote_average, 0) / rated.length
          : null;
      return {
        season_number: season.season_number,
        lastEpNumber,
        average,
        averageTier:
          average !== null ? ratingTier(average) : "egrid__cell--empty",
        episodes: episodes.map((e) => ({
          episode_number: e.episode_number,
          name: e.name,
          vote_average: e.vote_average,
        })),
      };
    })
    .filter((s): s is SlimSeason => s !== null);

  if (seasonData.length === 0) return null;

  const maxEpisodes = Math.max(...seasonData.map((s) => s.lastEpNumber));
  if (maxEpisodes === 0) return null;

  const epNums = Array.from({ length: maxEpisodes }, (_, i) => i + 1);

  const showMoreLabel = t("episodeRatingsShowMore");
  const showLessLabel = t("episodeRatingsShowLess");

  return (
    <>
      {/* Desktop: tres columnas fijas + scroll central */}
      <EpisodeRatingGridDesktop
        seriesId={seriesId}
        seasonData={seasonData}
        epNums={epNums}
        seasonPrefix={seasonPrefix}
        averageLabel={averageLabel}
        showMoreLabel={showMoreLabel}
        showLessLabel={showLessLabel}
        initialRows={DESKTOP_INITIAL}
        step={DESKTOP_STEP}
      />

      {/* Mobile: tabla scroll + botones debajo del promedio */}
      <EpisodeRatingGridMobile
        seriesId={seriesId}
        seasonData={seasonData}
        epNums={epNums}
        seasonPrefix={seasonPrefix}
        averageLabel={averageLabel}
        showMoreLabel={showMoreLabel}
        showLessLabel={showLessLabel}
        initialRows={MOBILE_INITIAL}
        step={MOBILE_STEP}
      />
    </>
  );
}

export function EpisodeRatingGridSkeleton() {
  return (
    <div className="sk-egrid">
      {Array.from({ length: 48 }).map((_, i) => (
        <div key={i} className="sk-egrid__cell skeleton" />
      ))}
    </div>
  );
}
