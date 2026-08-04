export function RatingSummary({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  const average =
    reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
    reviews.length;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter(
      (review) => Math.round(Number(review.rating || 0)) === star
    ).length;
    return {
      star,
      percent: Math.round((count / reviews.length) * 100),
    };
  });

  return (
    <div className="rating-summary">
      <div className="rs-score">
        <div className="rs-big">{average.toFixed(1)}</div>
        <div className="rs-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= Math.round(average) ? "lit" : ""}>
              ★
            </span>
          ))}
        </div>
        <div className="rs-count">Based on {reviews.length} verified ratings</div>
      </div>

      <div className="rs-bars">
        {distribution.map((row) => (
          <div className="rs-bar-row" key={row.star}>
            <span>{row.star}★</span>
            <div className="rs-bar-track">
              <div
                className="rs-bar-fill"
                style={{ width: `${row.percent}%` }}
              />
            </div>
            <b>{row.percent}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RatingSummary;