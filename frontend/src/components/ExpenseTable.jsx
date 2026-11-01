import { formatCurrency, formatDate } from '../utils/format';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            <th className="num">Amount</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>
                <div className="cell-title">{expense.title}</div>
                {expense.description && <div className="cell-sub">{expense.description}</div>}
              </td>
              <td><span className="badge">{expense.category_name}</span></td>
              <td>{formatDate(expense.expense_date)}</td>
              <td className="num strong">{formatCurrency(expense.amount)}</td>
              <td className="actions-col">
                <button className="btn btn-outline btn-sm" onClick={() => onEdit(expense)}>Edit</button>{' '}
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(expense)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
