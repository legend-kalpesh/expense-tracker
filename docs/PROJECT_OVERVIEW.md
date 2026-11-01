# Project Overview: Expense Tracker (Personal Expense Management System)

## Problem
People often do not know where their money goes each month. Notebooks and spreadsheets are easy to forget and give no visual summary.

## Solution
A web application where each registered user records expenses, groups them into categories and sees monthly and category-wise analysis in charts and reports.

## Architecture
```
React (Vite) SPA  --Axios + JWT-->  Express REST API  --mysql2 (parameterized SQL)-->  MySQL
  pages, charts        :5173            controllers, middleware     :5000                  expense_tracker_db
```
- **Frontend:** React, React Router (protected routes), Axios (token interceptor), Chart.js via react-chartjs-2, custom CSS (light theme with dark mode).
- **Backend:** Express in MVC style: routes -> controllers -> MySQL; middleware for authentication and errors.
- **Database:** `users`, `categories`, `expenses` with foreign keys and indexes.

## Database (ER summary)
```
users 1 ──< categories 1 ──< expenses >── 1 users
(ON DELETE CASCADE from users; categories -> expenses is RESTRICT)
```

## Modules
1. **Authentication:** register, login, logout, JWT, bcrypt, protected routes, duplicate-email check.
2. **Dashboard:** totals, current month, transaction count, top category, recent transactions, bar and doughnut charts (all from SQL).
3. **Expenses:** add, view, edit, delete (with confirmation); search, category/month/date-range filters, sorting.
4. **Categories:** add, rename, delete with safe handling of existing expenses; 10 defaults per user.
5. **Reports:** monthly comparison with % change, highest month, category shares, highest category.
6. **Extras:** monthly budget with warning, CSV export, dark mode, date-range filter, mobile sidebar.

## Design decisions to explain in the viva
- **Why bcrypt?** Passwords are stored as slow, salted hashes; a leaked database does not reveal passwords.
- **Why JWT?** The server stays stateless: each request carries a signed token that the `protect` middleware verifies.
- **Token storage:** `localStorage` keeps the session after refresh and is simple for beginners. Trade-off: JavaScript can read it, so an XSS bug could steal it; React escapes output by default, which reduces that risk. An httpOnly cookie is the hardened alternative.
- **SQL injection:** all queries use `?` placeholders; sorting uses a whitelist, never raw user text.
- **Data isolation:** every query includes `WHERE user_id = <id from the verified token>`.
- **Safe category deletion:** the database uses `ON DELETE RESTRICT`, and the API asks for a target category and moves the expenses in a transaction.
- **Charts stay current:** each page fetches from the API when it opens, so after adding, editing or deleting expenses the charts show the new database values.

## Team split suggestion (3 members)
- Member 1: database, authentication, security, README.
- Member 2: expense and category APIs, Postman, API tests.
- Member 3: React pages, dashboard charts, styling.
