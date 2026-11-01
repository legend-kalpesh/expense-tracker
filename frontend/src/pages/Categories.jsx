import { useCallback, useEffect, useState } from 'react';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../services/categoryService';
import { formatCurrency } from '../utils/format';

export default function Categories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // category being renamed
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState(null); // category waiting for delete confirmation
  const [moveTo, setMoveTo] = useState(''); // where to move its expenses

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return showToast('Enter a category name', 'error');
    setAdding(true);
    try {
      await createCategory(newName.trim());
      showToast('Category added');
      setNewName('');
      loadCategories();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return showToast('Enter a category name', 'error');
    try {
      await updateCategory(editing.id, editName.trim());
      showToast('Category updated');
      setEditing(null);
      loadCategories();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const openDelete = (category) => { setDeleting(category); setMoveTo(''); };

  const confirmDelete = async () => {
    const hasExpenses = deleting.expense_count > 0;
    if (hasExpenses && !moveTo) return showToast('Choose a category to move the expenses to', 'error');
    try {
      const result = await deleteCategory(deleting.id, hasExpenses ? moveTo : undefined);
      showToast(result.message);
      setDeleting(null);
      loadCategories();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const otherCategories = deleting ? categories.filter((c) => c.id !== deleting.id) : [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="muted">Group your expenses to see where your money goes.</p>
        </div>
      </div>

      <form className="card add-category" onSubmit={handleAdd}>
        <div className="form-group grow">
          <label htmlFor="newCategory">New category</label>
          <input id="newCategory" className="input" maxLength={50} placeholder="e.g. Gym"
            value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={adding}>{adding ? 'Adding...' : 'Add category'}</button>
      </form>

      <div className="card">
        {loading ? (
          <Loader />
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <h3>No categories</h3>
            <p className="muted">Add a category above to start organising your expenses.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th><th className="num">Expenses</th><th className="num">Total spent</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-title">{c.category_name}</td>
                    <td className="num">{c.expense_count}</td>
                    <td className="num strong">{formatCurrency(c.total_spent)}</td>
                    <td className="actions-col">
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditing(c); setEditName(c.category_name); }}>Rename</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => openDelete(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title="Rename category" onClose={() => setEditing(null)}>
          <form onSubmit={handleRename}>
            <div className="form-group">
              <label htmlFor="editName">Category name</label>
              <input id="editName" className="input" maxLength={50} autoFocus value={editName}
                onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save changes</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete category?" onClose={() => setDeleting(null)}>
          {deleting.expense_count === 0 ? (
            <p>Delete <strong>{deleting.category_name}</strong>? It has no expenses.</p>
          ) : otherCategories.length === 0 ? (
            <p>
              <strong>{deleting.category_name}</strong> has {deleting.expense_count} expense(s) and there is no
              other category to move them to. Add another category first.
            </p>
          ) : (
            <>
              <div className="alert alert-warning">
                <strong>{deleting.category_name}</strong> has {deleting.expense_count} expense(s). They will not
                be deleted. Choose where to move them:
              </div>
              <div className="form-group">
                <label htmlFor="moveTo">Move expenses to</label>
                <select id="moveTo" className="input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  <option value="">Select a category</option>
                  {otherCategories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleting(null)}>Cancel</button>
            {!(deleting.expense_count > 0 && otherCategories.length === 0) && (
              <button className="btn btn-danger" onClick={confirmDelete}>
                {deleting.expense_count > 0 ? 'Move expenses and delete' : 'Delete'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
