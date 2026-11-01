import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CategoryDoughnut from '../components/CategoryDoughnut.jsx';
import Loader from '../components/Loader.jsx';
import MonthlyBarChart from '../components/MonthlyBarChart.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';
import { getCategoryBreakdown, getMonthly } from '../services/dashboardService';
import { formatCurrency, formatMonth } from '../utils/format';

export default function Reports() {
  const { showToast } = useToast();
  const [monthly, setMonthly] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    Promise.all([getMonthly(), getCategoryBreakdown()])
      .then(([m, c]) => { setMonthly(m); setBreakdown(c); })
      .catch((err) => showToast(getErrorMessage(err), 'error'));
  }, [showToast]);

  if (!monthly || !breakdown) return <Loader />;

  if (breakdown.grand_total === 0) {
    return (
      <>
        <div className="page-header"><div><h1>Reports</h1></div></div>
        <div className="card empty-state">
          <div className="empty-icon">📈</div>
          <h3>Nothing to report yet</h3>
          <p className="muted">Reports appear once you have added some expenses.</p>
          <Link to="/expenses" className="btn btn-primary">Add an expense</Link>
        </div>
      </>
    );
  }

  const { months, highest_month: highestMonth } = monthly;
  const { categories, highest_category: highestCategory } = breakdown;

  // Month-over-month change (compare each month with the one before it)
  const monthsWithChange = months.map((m, i) => {
    const previous = i > 0 ? months[i - 1].total : null;
    let change = null;
    if (previous !== null && previous > 0) change = ((m.total - previous) / previous) * 100;
    return { ...m, change };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Monthly and category-wise analysis of your spending.</p>
        </div>
      </div>

      <div className="grid-cards grid-cards-3">
        <SummaryCard icon="💰" tone="blue" label="All-time spending" value={formatCurrency(breakdown.grand_total)} />
        <SummaryCard
          icon="📅" tone="purple" label="Highest spending month (last 12)"
          value={highestMonth ? formatMonth(highestMonth.month) : '—'}
          hint={highestMonth ? formatCurrency(highestMonth.total) : ''}
        />
        <SummaryCard
          icon="🏆" tone="orange" label="Highest spending category"
          value={highestCategory ? highestCategory.name : '—'}
          hint={highestCategory ? `${formatCurrency(highestCategory.total)} (${highestCategory.percentage}%)` : ''}
        />
      </div>

      <div className="grid-charts">
        <div className="card">
          <h3>Monthly expenses</h3>
          <p className="muted">Last 12 months</p>
          <MonthlyBarChart months={months} />
        </div>
        <div className="card">
          <h3>Category-wise expenses</h3>
          <p className="muted">All time</p>
          <CategoryDoughnut categories={categories} />
        </div>
      </div>

      <div className="grid-charts">
        <div className="card">
          <h3>Monthly comparison</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Month</th><th className="num">Total</th><th className="num">Change</th></tr>
              </thead>
              <tbody>
                {[...monthsWithChange].reverse().map((m) => (
                  <tr key={m.month}>
                    <td>{formatMonth(m.month)}{highestMonth && m.month === highestMonth.month && <span className="badge badge-warn">Highest</span>}</td>
                    <td className="num strong">{formatCurrency(m.total)}</td>
                    <td className={`num ${m.change === null ? '' : m.change > 0 ? 'text-up' : 'text-down'}`}>
                      {m.change === null ? '—' : `${m.change > 0 ? '▲' : m.change < 0 ? '▼' : ''} ${Math.abs(m.change).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Category breakdown</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Category</th><th className="num">Total</th><th>Share</th></tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-title">{c.name}</td>
                    <td className="num strong">{formatCurrency(c.total)}</td>
                    <td className="share-cell">
                      <div className="progress progress-sm"><div className="progress-bar" style={{ width: `${c.percentage}%` }} /></div>
                      <span>{c.percentage}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
