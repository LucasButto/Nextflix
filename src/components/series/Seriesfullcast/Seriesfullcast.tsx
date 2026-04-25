import { getSeasonDetails } from "@/services/series";
import { profileUrl } from "@/services/tmdb";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import CastCarousel from "@/components/shared/CastCarousel/CastCarousel";
import { Link } from "@/navigation";
import type {
  CastMember,
  GuestStar,
  Season,
  SeasonDetails,
  Episode,
} from "@/types/tmdb";

interface SeriesFullCastProps {
  seriesId: number;
  mainCast: CastMember[];
  seasons: Season[];
  title: string;
  limit?: number;
}

/**
 * Server component que trae los guest stars de TODAS las temporadas en paralelo,
 * los fusiona con el reparto principal (deduplicando por id), y renderiza un
 * CastCarousel único. Las temporadas que fallen se ignoran silenciosamente
 * para no romper la sección entera.
 *
 * Pensado para ser envuelto en <Suspense> en la página de serie, de forma que
 * el resto del contenido se muestre inmediatamente mientras este componente
 * resuelve sus fetches.
 */
export default async function SeriesFullCast({
  seriesId,
  mainCast,
  seasons,
  title,
  limit = 40,
}: SeriesFullCastProps) {
  // Solo temporadas reales con episodios (excluye specials S0 y temporadas
  // futuras vacías).
  const validSeasons = seasons.filter(
    (s) => s.season_number > 0 && s.episode_count > 0,
  );

  // Fetch paralelo de todas las temporadas. Los errores se tragan para que
  // una temporada problemática no rompa toda la sección.
  const seasonResults = await Promise.allSettled(
    validSeasons.map((s) => getSeasonDetails(seriesId, s.season_number)),
  );

  // Acumulamos guest stars de todos los episodios de todas las temporadas.
  const allGuestStars: GuestStar[] = [];
  for (const res of seasonResults) {
    if (res.status !== "fulfilled") continue;
    const seasonData = res.value as SeasonDetails & {
      episodes?: (Episode & { guest_stars?: GuestStar[] })[];
    };
    for (const ep of seasonData.episodes ?? []) {
      for (const g of ep.guest_stars ?? []) {
        allGuestStars.push(g);
      }
    }
  }

  // Unificamos: reparto principal primero, luego invitados.
  type CombinedCast = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    keyId: string;
  };
  const seen = new Set<number>();
  const combined: CombinedCast[] = [];

  for (const c of mainCast) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    combined.push({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
      keyId: `m-${c.credit_id}`,
    });
  }

  for (const g of allGuestStars) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    combined.push({
      id: g.id,
      name: g.name,
      character: g.character,
      profile_path: g.profile_path,
      keyId: `g-${g.credit_id}`,
    });
  }

  if (combined.length === 0) return null;

  return (
    <div className="detail-section">
      <h3 className="section-title">{title}</h3>
      <CastCarousel>
        {combined.slice(0, limit).map((actor) => (
          <Link
            key={actor.keyId}
            href={`/actor/${actor.id}`}
            className="detail-cast-card"
          >
            <FadeImage
              src={profileUrl(actor.profile_path, "sm")}
              alt={actor.name}
              width={100}
              height={100}
              className="detail-cast-img"
              skeletonVariant="circle"
              loading="lazy"
            />
            <p className="detail-cast-name">{actor.name}</p>
            <p className="detail-cast-char">{actor.character}</p>
          </Link>
        ))}
      </CastCarousel>
    </div>
  );
}
