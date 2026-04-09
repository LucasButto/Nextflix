import type { MovieDetails, SeriesDetails, CrewMember } from "@/types/tmdb";

export interface FunFact {
  label: string;
  value: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

function getCrewByJob(crew: CrewMember[], jobs: string[]): string[] {
  const names = crew.filter((c) => jobs.includes(c.job)).map((c) => c.name);
  return Array.from(new Set(names));
}

export function buildMovieFunFacts(
  movie: MovieDetails,
  t: (key: string) => string,
): FunFact[] {
  const facts: FunFact[] = [];
  const crew = movie.credits?.crew ?? [];

  // Director(s)
  const directors = getCrewByJob(crew, ["Director"]);
  if (directors.length > 0) {
    facts.push({ label: t("factDirector"), value: directors.join(", ") });
  }

  // Writer(s)
  const writers = getCrewByJob(crew, ["Screenplay", "Writer", "Story"]);
  if (writers.length > 0) {
    facts.push({
      label: t("factWriter"),
      value: writers.slice(0, 3).join(", "),
    });
  }

  // Budget
  if (movie.budget && movie.budget > 0) {
    facts.push({ label: t("factBudget"), value: formatCurrency(movie.budget) });
  }

  // Revenue
  if (movie.revenue && movie.revenue > 0) {
    facts.push({
      label: t("factRevenue"),
      value: formatCurrency(movie.revenue),
    });
  }

  // ROI
  if (movie.budget && movie.budget > 0 && movie.revenue && movie.revenue > 0) {
    const roi = ((movie.revenue - movie.budget) / movie.budget) * 100;
    const sign = roi >= 0 ? "+" : "";
    facts.push({
      label: t("factROI"),
      value: `${sign}${roi.toFixed(0)}%`,
    });
  }

  // Original title
  if (movie.original_title && movie.original_title !== movie.title) {
    facts.push({
      label: t("factOriginalTitle"),
      value: movie.original_title,
    });
  }

  // Production countries
  const countries = movie.production_countries ?? [];
  if (countries.length > 0) {
    facts.push({
      label: t("factCountry"),
      value: countries.map((c) => c.name).join(", "),
    });
  }

  // Spoken languages
  const langs = movie.spoken_languages ?? [];
  if (langs.length > 1) {
    facts.push({
      label: t("factLanguages"),
      value: langs.map((l) => l.name || l.english_name).join(", "),
    });
  }

  // Production companies
  const companies = movie.production_companies ?? [];
  if (companies.length > 0) {
    facts.push({
      label: t("factProduction"),
      value: companies
        .slice(0, 3)
        .map((c) => c.name)
        .join(", "),
    });
  }

  // TMDB votes
  if (movie.vote_count > 0) {
    facts.push({
      label: t("factVotes"),
      value: movie.vote_count.toLocaleString("en-US"),
    });
  }

  return facts;
}

export function buildSeriesFunFacts(
  series: SeriesDetails,
  t: (key: string) => string,
): FunFact[] {
  const facts: FunFact[] = [];

  // Created by
  const creators = series.created_by ?? [];
  if (creators.length > 0) {
    facts.push({
      label: t("factCreatedBy"),
      value: creators.map((c) => c.name).join(", "),
    });
  }

  // Networks
  const networks = series.networks ?? [];
  if (networks.length > 0) {
    facts.push({
      label: t("factNetwork"),
      value: networks.map((n) => n.name).join(", "),
    });
  }

  // Total episodes
  if (series.number_of_episodes > 0) {
    facts.push({
      label: t("factEpisodes"),
      value: `${series.number_of_episodes}`,
    });
  }

  // Original name
  if (series.original_name && series.original_name !== series.name) {
    facts.push({
      label: t("factOriginalTitle"),
      value: series.original_name,
    });
  }

  // Origin country
  const origins = series.origin_country ?? [];
  if (origins.length > 0) {
    const countries = series.production_countries ?? [];
    const names = origins.map((code) => {
      const match = countries.find((c) => c.iso_3166_1 === code);
      return match?.name ?? code;
    });
    facts.push({
      label: t("factCountry"),
      value: names.join(", "),
    });
  }

  // Spoken languages
  const langs = series.spoken_languages ?? [];
  if (langs.length > 1) {
    facts.push({
      label: t("factLanguages"),
      value: langs.map((l) => l.name || l.english_name).join(", "),
    });
  }

  // Production companies
  const companies = series.production_companies ?? [];
  if (companies.length > 0) {
    facts.push({
      label: t("factProduction"),
      value: companies
        .slice(0, 3)
        .map((c) => c.name)
        .join(", "),
    });
  }

  // Type (Scripted, Documentary, etc.)
  if (series.type) {
    facts.push({
      label: t("factType"),
      value: series.type,
    });
  }

  // TMDB votes
  if (series.vote_count > 0) {
    facts.push({
      label: t("factVotes"),
      value: series.vote_count.toLocaleString("en-US"),
    });
  }

  return facts;
}
