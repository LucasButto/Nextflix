import "@/styles/_skeletons.scss";

export default function EpisodeDetailLoading() {
  return (
    <div className="ep-sk">
      {/* ── Hero backdrop ───────────────────────────────────────────── */}
      <div className="ep-sk__hero">
        <div className="ep-sk__hero-bg skeleton" />
        <div className="ep-sk__hero-gradient" />
      </div>

      <div className="ep-sk__content">
        {/* ── Still del episodio (izquierda) ──────────────────────── */}
        <div className="ep-sk__still skeleton" />

        {/* ── Metadatos (derecha) ─────────────────────────────────── */}
        <div className="ep-sk__meta">
          {/* Breadcrumb: Serie › Temporada */}
          <div className="ep-sk__breadcrumb">
            <div className="ep-sk__bar ep-sk__bar--breadcrumb skeleton" />
          </div>

          {/* Título */}
          <div className="ep-sk__bar ep-sk__bar--title skeleton" />
          <div className="ep-sk__bar ep-sk__bar--title ep-sk__bar--title-short skeleton" />

          {/* Badge + rating + fecha + duración */}
          <div className="ep-sk__badges">
            <div className="ep-sk__badge skeleton" />
            <div className="ep-sk__badge ep-sk__badge--wide skeleton" />
            <div className="ep-sk__badge ep-sk__badge--wide skeleton" />
            <div className="ep-sk__badge skeleton" />
          </div>

          {/* Dirección / Guión */}
          <div className="ep-sk__bar ep-sk__bar--credit skeleton" />
          <div className="ep-sk__bar ep-sk__bar--credit skeleton" />

          {/* Overview */}
          <div className="ep-sk__bar ep-sk__bar--body skeleton" />
          <div className="ep-sk__bar ep-sk__bar--body skeleton" />
          <div className="ep-sk__bar ep-sk__bar--body ep-sk__bar--body-short skeleton" />

          {/* Botones de navegación */}
          <div className="ep-sk__actions">
            <div className="ep-sk__action-btn skeleton" />
            <div className="ep-sk__action-btn ep-sk__action-btn--wide skeleton" />
            <div className="ep-sk__action-btn skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
