import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard.jsx';
import MonthlyBarChart from '../components/MonthlyBarChart.jsx';
import CategoryDoughnut from '../components/CategoryDoughnut.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';
import { getCategoryBreakdown, getMonthly, getSummary, saveBudget } from '../services/dashboardService';
import { formatCurrency, formatDate } from '../utils/format';

export default function Dashboard() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // Every number and chart on this page comes from the backend (MySQL)
  const loadData = useCallback(async () => {
    try {
      const [summaryData, monthlyData, categoryData] = await Promise.all([
        getSummary(), getMonthly(), getCategoryBreakdown(),
      ]);
      setSummary(summaryData);
      setMonthly(monthlyData.months);
      setCategories(categoryData.categories);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveBudget = async (event) => {
    event.preventDefault();
    try {
      await saveBudget(Number(budgetInput) || 0);
      showToast('Monthly budget saved');
      setBudgetOpen(false);
      loadData();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <Loader />;
  if (!summary) return <div className="alert alert-danger">Could not load the dashboard.</div>;

  const hasBudget = summary.monthly_budget > 0;
  const overBudget = hasBudget && summary.current_month_expenses > summary.monthly_budget;
  const budgetUsed = hasBudget ? Math.min(100, (summary.current_month_expenses / summary.monthly_budget) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Your spending at a glance.</p>
        </div>
        <Link to="/expenses" className="btn btn-primary">+ Add expense</Link>
      </div>

      {overBudget && (
        <div className="alert alert-warning">
          You have spent {formatCurrency(summary.current_month_expenses)} this month, which is over your
          budget of {formatCurrency(summary.monthly_budget)}.
        </div>
      )}

      <div className="grid-cards">
        <SummaryCard icon="💳" tone="blue" label="Total expenses" value={formatCurrency(summary.total_expenses)} />
        <SummaryCard icon="📅" tone="purple" label="This month" value={formatCurrency(summary.current_month_expenses)} />
        <SummaryCard icon="🧾" tone="green" label="Transactions" value={summary.total_transactions} />
        <SummaryCard
          icon="🏆" tone="orange" label="Top category"
          value={summary.top_category ? summary.top_category.name : '—'}
          hint={summary.top_category ? formatCurrency(summary.top_category.total) : 'No data yet'}
        />
      </div>

      {/* Monthly budget (optional feature) */}
      <div className="card budget-card">
        <div className="budget-top">
          <div>
            <strong>Monthly budget</strong>
            <div className="muted">
              {hasBudget
                ? `${formatCurrency(summary.current_month_expenses)} of ${formatCurrency(summary.monthly_budget)} used`
                : 'Set a budget to get a warning when you go over it.'}
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { setBudgetInput(hasBudget ? summary.monthly_budget : ''); setBudgetOpen(true); }}
          >
            {hasBudget ? 'Change budget' : 'Set budget'}
          </button>
        </div>
        {hasBudget && (
          <div className="progress">
            <div className={overBudget ? 'progress-bar over' : 'progress-bar'} style={{ width: `${budgetUsed}%` }} />
          </div>
        )}
      </div>

      {summary.total_transactions === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🧾</div>
          <h3>No expenses yet</h3>
          <p className="muted">Add your first expense and your charts will appear here.</p>
          <Link to="/expenses" className="btn btn-primary">Add your first expense</Link>
        </div>
      ) : (
        <>
          <div className="grid-charts">
            <div className="card">
              <h3>Monthly expenses</h3>
              <p className="muted">Last 12 months</p>
              <MonthlyBarChart months={monthly} />
            </div>
            <div className="card">
              <h3>Spending by category</h3>
              <p className="muted">All time</p>
              <CategoryDoughnut categories={categories} />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Recent transactions</h3>
              <Link to="/expenses">View all</Link>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Date</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {summary.recent_transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="cell-title">{t.title}</td>
                      <td><span className="badge">{t.category_name}</span></td>
                      <td>{formatDate(t.expense_date)}</td>
                      <td className="num strong">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {budgetOpen && (
        <Modal title="Monthly budget" onClose={() => setBudgetOpen(false)}>
          <form onSubmit={handleSaveBudget}>
            <div className="form-group">
              <label htmlFor="budget">Budget for each month (₹)</label>
              <input id="budget" type="number" min="0" step="1" className="input" autoFocus
                value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
              <small className="muted">Enter 0 to remove your budget.</small>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setBudgetOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save budget</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
