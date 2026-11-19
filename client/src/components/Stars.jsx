export default function Stars({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {'★★★★★'.slice(0, full)}
      <span className="stars-off">{'★★★★★'.slice(full)}</span>
      {count !== undefined && <span className="muted small"> ({count})</span>}
    </span>
  );
}
