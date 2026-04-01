// Actor page loading skeleton (photo + bio + 2 filmography carousels)

export default function Loading() {
  const cards = Array.from({ length: 8 });

  return (
    <>
      {/* ── Header: photo + bio ── */}
      <div className="sk-actor-header">
        <div className="sk-actor-header__photo" />
        <div className="sk-actor-header__bio">
          <div className="sk-actor-header__name" />
          <div className="sk-actor-header__facts">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="sk-actor-header__fact">
                <div className="sk-actor-header__fact-label" />
                <div className="sk-actor-header__fact-val" />
              </div>
            ))}
          </div>
          <div className="sk-actor-header__text-line" />
          <div className="sk-actor-header__text-line" />
          <div className="sk-actor-header__text-line" />
          <div className="sk-actor-header__text-line" />
          <div className="sk-actor-header__text-line" />
        </div>
      </div>

      {/* ── Filmography ── */}
      {[0, 1].map((i) => (
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
