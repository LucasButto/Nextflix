// Series page loading skeleton
// La página no tiene hero: fila wide (tendencias) + Top 100 + filas de géneros

export default function Loading() {
  const wide = Array.from({ length: 6 });
  const top10 = Array.from({ length: 8 });
  const cards = Array.from({ length: 8 });

  return (
    <>
      {/* ── Tendencias (wide) ── */}
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

      {/* ── Top 100 (top10 + botón de acción) ── */}
      <div className="sk-carousel">
        <div className="sk-carousel__header">
          <div className="sk-carousel__title" />
          <div className="sk-carousel__action" />
        </div>
        <div className="sk-carousel__row">
          {top10.map((_, j) => (
            <div key={j} className="sk-carousel__card sk-carousel__card--top10">
              <div className="sk-carousel__rank" />
              <div className="sk-carousel__poster" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Géneros (filas normales) ── */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="sk-carousel">
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
