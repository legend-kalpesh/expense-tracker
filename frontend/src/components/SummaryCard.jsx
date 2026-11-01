export default function SummaryCard({ icon, label, value, hint, tone = 'blue' }) {
  return (
    <div className="card summary-card">
      <div className={`summary-icon tone-${tone}`}>{icon}</div>
      <div>
        <div className="summary-label">{label}</div>
        <div className="summary-value">{value}</div>
        {hint && <div className="summary-hint">{hint}</div>}
      </div>
    </div>
  );
}
