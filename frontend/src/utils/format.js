const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-03-07' -> '7 Mar 2026'  (no Date object, so no timezone surprises)
export const formatDate = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
};

// '2026-03' -> 'Mar 2026'
export const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
};

// Today's date in the user's own timezone as YYYY-MM-DD
export const todayISO = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Download the given expenses as a CSV file
export const downloadExpensesCsv = (expenses) => {
  // A leading = + - @ can be run as a formula by Excel, so we neutralise it
  const safe = (text) => {
    let value = String(text ?? '');
    if (/^[=+\-@]/.test(value)) value = `'${value}`;
    return `"${value.replace(/"/g, '""')}"`;
  };
  const header = ['Title', 'Category', 'Date', 'Amount', 'Description'];
  const lines = expenses.map((e) =>
    [safe(e.title), safe(e.category_name), safe(e.expense_date), e.amount, safe(e.description)].join(',')
  );
  const csv = `\uFEFF${[header.join(','), ...lines].join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses-${todayISO()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
