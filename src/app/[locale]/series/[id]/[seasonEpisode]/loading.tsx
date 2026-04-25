// Episode detail loading skeleton (Hero + still 16:9 + breadcrumb + meta + nav + cast + stills grid)

export default function Loading() {
  const castItems = Array.from({ length: 10 });
  const stillItems = Array.from({ length: 6 });

  return (
    <div className="detail-page detail-page--episode">
      <div className="sk-detail-hero" />
      <div className="sk-detail-info">
        <div
          className="sk-detail-info__poster"
          style={{
            width: "320px",
            aspectRatio: "16 / 9",
            maxWidth: "100%",
          }}
        />
        <div className="sk-detail-info__body">
          <div className="sk-ep-breadcrumb">
            <div className="sk-ep-breadcrumb__crumb" />
            <div className="sk-ep-breadcrumb__sep" />
            <div className="sk-ep-breadcrumb__crumb sk-ep-breadcrumb__crumb--short" />
          </div>

          <div className="sk-detail-info__title" />

          <div className="sk-detail-info__meta">
            <div className="sk-detail-info__meta-item" />
            <div className="sk-detail-info__meta-item" />
            <div className="sk-detail-info__meta-item" />
            <div className="sk-detail-info__meta-item" />
          </div>

          <div className="sk-ep-crew">
            <div className="sk-ep-crew__row" />
            <div className="sk-ep-crew__row sk-ep-crew__row--short" />
          </div>

          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__overview-line" />
          <div className="sk-detail-info__overview-line" />

          <div className="sk-ep-nav">
            <div className="sk-ep-nav__btn" />
            <div className="sk-ep-nav__btn" />
            <div className="sk-ep-nav__btn" />
          </div>
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

      <div className="sk-ep-stills">
        <div className="sk-ep-stills__title" />
        <div className="sk-ep-stills__grid">
          {stillItems.map((_, i) => (
            <div key={i} className="sk-ep-stills__item" />
          ))}
        </div>
      </div>

      <div style={{ height: "4rem" }} />
    </div>
  );
}
