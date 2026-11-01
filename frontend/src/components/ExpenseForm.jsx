import { useState } from 'react';
import { todayISO } from '../utils/format';

// Used for both "Add expense" and "Edit expense".
// Pass `initial` to pre-fill the form when editing.
export default function ExpenseForm({ categories, initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial?.amount ?? '',
    category_id: initial?.category_id || '',
    expense_date: initial?.expense_date || todayISO(),
    description: initial?.description || '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    // Basic checks here for quick feedback (the server validates again)
    if (!form.title.trim()) return setError('Please enter a title');
    if (!(Number(form.amount) > 0)) return setError('Amount must be greater than 0');
    if (!form.category_id) return setError('Please choose a category');
    if (!form.expense_date) return setError('Please choose a date');
    setError('');
    onSubmit({
      ...form,
      title: form.title.trim(),
      amount: Number(form.amount),
      category_id: Number(form.category_id),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" className="input" maxLength={150} value={form.title}
          onChange={handleChange} placeholder="e.g. Grocery shopping" autoFocus />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="amount">Amount (₹)</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" className="input"
            value={form.amount} onChange={handleChange} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label htmlFor="expense_date">Date</label>
          <input id="expense_date" name="expense_date" type="date" className="input"
            value={form.expense_date} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="category_id">Category</label>
        <select id="category_id" name="category_id" className="input" value={form.category_id}
          onChange={handleChange}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.category_name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (optional)</label>
        <textarea id="description" name="description" rows="3" maxLength={1000} className="input"
          value={form.description} onChange={handleChange} />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : initial ? 'Save changes' : 'Add expense'}
        </button>
      </div>
    </form>
  );
}
