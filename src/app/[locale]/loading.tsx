// Home page loading skeleton
// Refleja el contenido real: Hero + Top 10 (pelis/series) + fila wide + filas normales

export default function Loading() {
  const top10 = Array.from({ length: 8 });
  const wide = Array.from({ length: 5 });
  const cards = Array.from({ length: 8 });

  return (
    <>
      {/* ── Hero ── */}
      <div className="sk-hero">
        <div className="sk-hero__gradient" />
        <div className="sk-hero__content">
          <div className="sk-hero__badge" />
          <div className="sk-hero__title" />
          <div className="sk-hero__meta">
            <div className="sk-hero__meta-item" />
            <div className="sk-hero__meta-item" />
          </div>
          <div className="sk-hero__overview" />
          <div className="sk-hero__overview" />
          <div className="sk-hero__overview" />
          <div className="sk-hero__btns">
            <div className="sk-hero__btn" />
            <div className="sk-hero__btn" />
          </div>
        </div>
      </div>

      {/* ── Top 10 (películas + series) ── */}
      {[0, 1].map((i) => (
        <div key={`top-${i}`} className="sk-carousel">
          <div className="sk-carousel__title" />
          <div className="sk-carousel__row">
            {top10.map((_, j) => (
              <div
                key={j}
                className="sk-carousel__card sk-carousel__card--top10"
              >
                <div className="sk-carousel__rank" />
                <div className="sk-carousel__poster" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Fila wide (en cartelera) ── */}
      <div className="sk-carousel">
        <div className="sk-carousel__title" />
        <div className="sk-carousel__row">
          {wide.map((_, j) => (
            <div key={j} className="sk-carousel__card sk-carousel__card--wide">
              <div className="sk-carousel__img" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Filas normales (populares) ── */}
      {[0, 1].map((i) => (
        <div key={`row-${i}`} className="sk-carousel">
          <div className="sk-carousel__title" />
          <div className="sk-carousel__row">
            {cards.map((_, j) => (
              <div key={j} className="sk-carousel__card">
                <div className="sk-carousel__img" />
                <div className="sk-carousel__line" />
                <div className="sk-carousel__line sk-carousel__line--short" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ height: "4rem" }} />
    </>
  );
}
