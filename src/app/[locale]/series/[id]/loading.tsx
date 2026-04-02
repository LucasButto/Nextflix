// Serie detail loading skeleton (Hero + poster + cast + seasons + 1 carousel)

export default function Loading() {
  const castItems = Array.from({ length: 10 });
  const cards = Array.from({ length: 8 });

  return (
    <div className="detail-page">
      <div className="sk-detail-hero" />

      <div className="sk-detail-info">
        <div className="sk-detail-info__poster" />
        <div className="sk-detail-info__body">
          <div className="sk-detail-info__title" />
          <div className="sk-detail-info__meta">
            <div className="sk-detail-info__meta-item" />
            <div className="sk-detail-info__meta-item" />
            <div className="sk-detail-info__meta-item" />
          </div>
          <div className="sk-detail-info__genres">
            <div className="sk-detail-info__genre" />
            <div className="sk-detail-info__genre" />
            <div className="sk-detail-info__genre" />
          </div>
          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__btn" />
        </div>
      </div>

      <div className="sk-cast">
        <div className="sk-cast__title" />
        <div className="sk-cast__grid">
          {castItems.map((_, i) => (
            <div key={i} className="sk-cast__item">
              <div className="sk-cast__avatar" />
              <div className="sk-cast__name" />
              <div className="sk-cast__char" />
            </div>
          ))}
        </div>
      </div>

      <div className="sk-carousel">
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

      <div style={{ height: "4rem" }} />
    </div>
  );
}
