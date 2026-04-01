export default function Loading() {
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

      {/* ── Carousels ── */}
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
