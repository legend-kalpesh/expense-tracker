import { useEffect, useState } from 'react';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExpenseTable from '../components/ExpenseTable.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';
import { getCategories } from '../services/categoryService';
import { createExpense, deleteExpense, getExpenses, updateExpense } from '../services/expenseService';
import { downloadExpensesCsv, formatCurrency } from '../utils/format';

const EMPTY_FILTERS = { search: '', category_id: '', month: '', from: '', to: '', sort: 'date_desc' };

export default function Expenses() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0); // change it to re-fetch the list
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // the expense being edited (null = adding)
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // the expense waiting for delete confirmation

  // Load categories once (for the filter dropdown and the form)
  useEffect(() => {
    getCategories().then(setCategories).catch((err) => showToast(getErrorMessage(err), 'error'));
  }, [showToast]);

  // Load expenses whenever a filter changes (waits 300 ms so typing in search is not too chatty)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getExpenses(filters);
        if (!cancelled) {
          setExpenses(data.expenses);
          setTotal(data.total);
        }
      } catch (err) {
        if (!cancelled) showToast(getErrorMessage(err), 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters, reloadKey, showToast]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const hasActiveFilters = ['search', 'category_id', 'month', 'from', 'to'].some((key) => filters[key] !== '');

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (expense) => { setEditing(expense); setFormOpen(true); };
  const closeForm = () => setFormOpen(false);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateExpense(editing.id, data);
        showToast('Expense updated');
      } else {
        await createExpense(data);
        showToast('Expense added');
      }
      setFormOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteExpense(deleting.id);
      showToast('Expense deleted');
      setDeleting(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="muted">Add, search and manage your expenses.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" disabled={!expenses.length} onClick={() => downloadExpensesCsv(expenses)}>
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add expense</button>
        </div>
      </div>

      <div className="card filters">
        <div className="form-group">
          <label htmlFor="f-search">Search title</label>
          <input id="f-search" name="search" className="input" placeholder="Search..." value={filters.search} onChange={handleFilterChange} />
        </div>
        <div className="form-group">
          <label htmlFor="f-category">Category</label>
          <select id="f-category" name="category_id" className="input" value={filters.category_id} onChange={handleFilterChange}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="f-month">Month</label>
          <input id="f-month" name="month" type="month" className="input" value={filters.month} onChange={handleFilterChange} />
        </div>
        <div className="form-group">
          <label htmlFor="f-from">From</label>
          <input id="f-from" name="from" type="date" className="input" value={filters.from} onChange={handleFilterChange} />
        </div>
        <div className="form-group">
          <label htmlFor="f-to">To</label>
          <input id="f-to" name="to" type="date" className="input" value={filters.to} onChange={handleFilterChange} />
        </div>
        <div className="form-group">
          <label htmlFor="f-sort">Sort by</label>
          <select id="f-sort" name="sort" className="input" value={filters.sort} onChange={handleFilterChange}>
            <option value="date_desc">Date: newest first</option>
            <option value="date_asc">Date: oldest first</option>
            <option value="amount_desc">Amount: high to low</option>
            <option value="amount_asc">Amount: low to high</option>
          </select>
        </div>
        {hasActiveFilters && (
          <button className="btn btn-outline btn-sm filters-clear" onClick={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })}>
            Clear filters
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <Loader />
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{hasActiveFilters ? '🔍' : '🧾'}</div>
            <h3>{hasActiveFilters ? 'No expenses match your filters' : 'No expenses yet'}</h3>
            <p className="muted">
              {hasActiveFilters ? 'Try changing or clearing the filters.' : 'Add your first expense to start tracking.'}
            </p>
            {!hasActiveFilters && <button className="btn btn-primary" onClick={openAdd}>Add your first expense</button>}
          </div>
        ) : (
          <>
            <div className="list-summary">
              {expenses.length} expense{expenses.length === 1 ? '' : 's'} · Total <strong>{formatCurrency(total)}</strong>
            </div>
            <ExpenseTable expenses={expenses} onEdit={openEdit} onDelete={setDeleting} />
          </>
        )}
      </div>

      {formOpen && (
        <Modal title={editing ? 'Edit expense' : 'Add expense'} onClose={closeForm}>
          {categories.length === 0 ? (
            <p>Create a category first on the Categories page.</p>
          ) : (
            <ExpenseForm categories={categories} initial={editing} onSubmit={handleSave} onCancel={closeForm} submitting={saving} />
          )}
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete expense?" onClose={() => setDeleting(null)}>
          <p>
            Delete <strong>{deleting.title}</strong> ({formatCurrency(deleting.amount)})? This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}
