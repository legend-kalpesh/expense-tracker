// End-to-end API test. Start the backend first (npm run dev), then in another terminal:
//   npm run test:api
// Needs Node 18+ (built-in fetch). It creates two throw-away users with random emails.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
}

function check(name, condition) {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`); }
  else { failed += 1; console.log(`  FAIL  ${name}`); }
}

const pad = (n) => String(n).padStart(2, '0');
// Date in "offset" months ago, on the given day
function monthDate(offset, day) {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`, key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` };
}

(async () => {
  const stamp = Date.now();
  const emailA = `a_${stamp}@test.com`;
  const emailB = `b_${stamp}@test.com`;
  const password = 'Test1234';

  console.log('\nAuthentication');
  let r = await call('POST', '/auth/register', { name: 'User A', email: emailA, password });
  check('register new user -> 201 + token', r.status === 201 && !!r.data.token);
  const tokenA = r.data.token;
  r = await call('POST', '/auth/register', { name: 'User A', email: emailA, password });
  check('duplicate email rejected -> 409', r.status === 409);
  r = await call('POST', '/auth/register', { name: 'X', email: 'not-an-email', password: '123' });
  check('invalid registration rejected -> 400', r.status === 400);
  r = await call('POST', '/auth/login', { email: emailA, password });
  check('login with valid credentials -> 200', r.status === 200 && !!r.data.token);
  r = await call('POST', '/auth/login', { email: emailA, password: 'WrongPass1' });
  check('login with wrong password -> 401', r.status === 401);
  r = await call('GET', '/auth/me', null, tokenA);
  check('GET /auth/me returns the user', r.status === 200 && r.data.user.email === emailA);
  r = await call('GET', '/expenses');
  check('no token -> 401', r.status === 401);
  r = await call('GET', '/expenses', null, 'garbage.token.value');
  check('invalid token -> 401', r.status === 401);

  r = await call('POST', '/auth/register', { name: 'User B', email: emailB, password });
  const tokenB = r.data.token;

  console.log('\nCategories');
  r = await call('GET', '/categories', null, tokenA);
  check('10 default categories created', r.data.categories.length === 10);
  const food = r.data.categories.find((c) => c.category_name === 'Food');
  const rent = r.data.categories.find((c) => c.category_name === 'Rent');
  const other = r.data.categories.find((c) => c.category_name === 'Other');
  r = await call('POST', '/categories', { category_name: 'Gym' }, tokenA);
  check('add category -> 201', r.status === 201);
  const gymId = r.data.category.id;
  r = await call('POST', '/categories', { category_name: 'gym' }, tokenA);
  check('duplicate category name rejected -> 409', r.status === 409);
  r = await call('PUT', `/categories/${gymId}`, { category_name: 'Fitness' }, tokenA);
  check('edit category -> 200', r.status === 200 && r.data.category.category_name === 'Fitness');
  r = await call('POST', '/categories', { category_name: '   ' }, tokenA);
  check('empty category name rejected -> 400', r.status === 400);

  console.log('\nExpenses');
  const thisMonth = monthDate(0, 10);
  const lastMonth = monthDate(1, 5);
  r = await call('POST', '/expenses', { title: 'Lunch', amount: 100, category_id: food.id, expense_date: thisMonth.date, description: 'x' }, tokenA);
  check('add expense -> 201', r.status === 201);
  const lunchId = r.data.expense.id;
  await call('POST', '/expenses', { title: 'Dinner', amount: 50.5, category_id: food.id, expense_date: monthDate(0, 11).date }, tokenA);
  await call('POST', '/expenses', { title: 'Flat rent', amount: 1000, category_id: rent.id, expense_date: lastMonth.date }, tokenA);
  r = await call('POST', '/expenses', { title: '', amount: -5, category_id: food.id, expense_date: 'bad' }, tokenA);
  check('invalid expense rejected -> 400', r.status === 400);
  r = await call('POST', '/expenses', { title: 'Bad cat', amount: 5, category_id: 999999, expense_date: thisMonth.date }, tokenA);
  check('unknown category rejected -> 400', r.status === 400);

  r = await call('PUT', `/expenses/${lunchId}`, { title: 'Big lunch', amount: 120, category_id: food.id, expense_date: thisMonth.date }, tokenA);
  check('edit expense -> 200 with new values', r.status === 200 && r.data.expense.title === 'Big lunch' && r.data.expense.amount === 120);

  r = await call('GET', '/expenses?search=dinner', null, tokenA);
  check('search by title', r.data.count === 1);
  r = await call('GET', `/expenses?category_id=${rent.id}`, null, tokenA);
  check('filter by category', r.data.count === 1 && r.data.expenses[0].title === 'Flat rent');
  r = await call('GET', `/expenses?month=${lastMonth.key}`, null, tokenA);
  check('filter by month', r.data.count === 1);
  r = await call('GET', '/expenses?sort=amount_desc', null, tokenA);
  check('sort by amount desc', r.data.expenses[0].amount === 1000);
  r = await call('GET', '/expenses?sort=amount_asc', null, tokenA);
  check('sort by amount asc', r.data.expenses[0].amount === 50.5);
  r = await call('GET', `/expenses?from=${thisMonth.date}&to=${thisMonth.date}`, null, tokenA);
  check('date-range filter', r.data.count === 1);

  console.log('\nDashboard totals');
  r = await call('GET', '/dashboard/summary', null, tokenA);
  check('summary total = 1170.5', r.data.total_expenses === 1170.5);
  check('summary current month = 170.5', r.data.current_month_expenses === 170.5);
  check('summary transactions = 3', r.data.total_transactions === 3);
  check('top category = Rent', r.data.top_category.name === 'Rent');
  r = await call('GET', '/dashboard/monthly', null, tokenA);
  const mThis = r.data.months.find((m) => m.month === thisMonth.key);
  const mLast = r.data.months.find((m) => m.month === lastMonth.key);
  check('monthly total (this month) = 170.5', mThis.total === 170.5);
  check('monthly total (last month) = 1000', mLast.total === 1000);
  check('highest month = last month', r.data.highest_month.month === lastMonth.key);
  r = await call('GET', '/dashboard/categories', null, tokenA);
  const foodRow = r.data.categories.find((c) => c.name === 'Food');
  check('category total Food = 170.5', foodRow.total === 170.5);
  check('category percentages add up to ~100', Math.abs(r.data.categories.reduce((s, c) => s + c.percentage, 0) - 100) < 0.2);
  r = await call('PUT', '/dashboard/budget', { monthly_budget: 5000 }, tokenA);
  check('set budget -> 200', r.status === 200);
  r = await call('PUT', '/dashboard/budget', { monthly_budget: -1 }, tokenA);
  check('negative budget rejected -> 400', r.status === 400);

  console.log('\nUser isolation (user B must not see user A data)');
  r = await call('GET', '/expenses', null, tokenB);
  check('user B sees 0 expenses', r.data.count === 0);
  r = await call('GET', `/expenses/${lunchId}`, null, tokenB);
  check("user B cannot read A's expense -> 404", r.status === 404);
  r = await call('PUT', `/expenses/${lunchId}`, { title: 'Hack', amount: 1, category_id: food.id, expense_date: thisMonth.date }, tokenB);
  check("user B cannot edit A's expense -> 404/400", r.status === 404 || r.status === 400);
  r = await call('DELETE', `/expenses/${lunchId}`, null, tokenB);
  check("user B cannot delete A's expense -> 404", r.status === 404);
  r = await call('POST', '/expenses', { title: 'Sneaky', amount: 5, category_id: food.id, expense_date: thisMonth.date }, tokenB);
  check("user B cannot use A's category -> 400", r.status === 400);
  r = await call('DELETE', `/categories/${food.id}`, null, tokenB);
  check("user B cannot delete A's category -> 404", r.status === 404);
  r = await call('GET', '/dashboard/summary', null, tokenB);
  check('user B dashboard is empty', r.data.total_expenses === 0);

  console.log('\nSafe category deletion');
  r = await call('DELETE', `/categories/${food.id}`, null, tokenA);
  check('delete category with expenses is refused -> 409', r.status === 409 && r.data.code === 'CATEGORY_HAS_EXPENSES');
  r = await call('DELETE', `/categories/${food.id}?reassign_to=${food.id}`, null, tokenA);
  check('cannot move expenses to the same category -> 400', r.status === 400);
  r = await call('DELETE', `/categories/${food.id}?reassign_to=${other.id}`, null, tokenA);
  check('delete with reassign -> 200', r.status === 200);
  r = await call('GET', `/expenses?category_id=${other.id}`, null, tokenA);
  check('expenses were moved, not deleted', r.data.count === 2);
  r = await call('DELETE', `/categories/${gymId}`, null, tokenA);
  check('delete empty category -> 200', r.status === 200);

  console.log('\nDelete expense');
  r = await call('DELETE', `/expenses/${lunchId}`, null, tokenA);
  check('delete expense -> 200', r.status === 200);
  r = await call('GET', `/expenses/${lunchId}`, null, tokenA);
  check('deleted expense is gone -> 404', r.status === 404);
  r = await call('GET', '/dashboard/summary', null, tokenA);
  check('dashboard updates after delete (total = 1050.5)', r.data.total_expenses === 1050.5);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('Test run crashed. Is the backend running?', err.message);
  process.exit(1);
});
