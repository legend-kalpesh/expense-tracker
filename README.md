# Expense Tracker: Personal Expense Management System

Full-stack MCA mini-project. **React + Vite**, **Node.js + Express**, **MySQL**, **JWT**, **Chart.js**.

Users register, log in, record expenses, organise them in categories and see monthly and category-wise analysis in charts. Each user can only see their own data.

## Project structure
```
expense-tracker/
├── database/schema.sql          # creates expense_tracker_db and the 3 tables
├── backend/                     # Express REST API
│   ├── config/db.js             # MySQL connection pool
│   ├── controllers/             # auth, expense, category, dashboard logic
│   ├── middleware/              # JWT check + error handling
│   ├── routes/                  # URL -> controller mapping
│   ├── utils/                   # validation helpers
│   ├── tests/api-smoke-test.js  # automated API test (npm run test:api)
│   ├── seed.js                  # optional demo data
│   └── server.js
├── frontend/                    # React + Vite app
│   └── src/ components/ pages/ services/ context/ utils/ styles/
├── postman/ExpenseTracker.postman_collection.json
└── docs/                        # API.md, PROJECT_OVERVIEW.md, screenshots/
```

## 1. Prerequisites
- [Node.js](https://nodejs.org) 18 or newer (check: `node -v`)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) 8.x, running, and you know a MySQL username and password
- Git, Visual Studio Code, Postman

## 2. Create the database (Windows PowerShell)
Open PowerShell in the project root (the folder that contains `database`, `backend`, `frontend`):

```powershell
mysql -u root -p -e "source database/schema.sql"
```
Enter your MySQL password when asked. Replace `root` with your own MySQL username if different.

- If `mysql` is "not recognized", either add MySQL's `bin` folder (for example `C:\Program Files\MySQL\MySQL Server 8.0\bin`) to your PATH, or open `database/schema.sql` in **MySQL Workbench** and click the lightning-bolt Run button.
- Do not use `mysql ... < file.sql` in PowerShell; PowerShell does not support `<` redirection. The command above avoids that.

Check it worked:
```powershell
mysql -u root -p -e "USE expense_tracker_db; SHOW TABLES;"
```
You should see `categories`, `expenses`, `users`.

## 3. Start the backend
```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```
In Notepad, fill in `DB_USER`, `DB_PASSWORD` and a long random `JWT_SECRET`. Generate a secret with:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Then:
```powershell
npm install
npm run dev
```
Expected output: `API running on http://localhost:5000`. Test in a browser: http://localhost:5000/api/health should show `{"status":"ok"}`.

If you see `Cannot connect to MySQL`, re-check the `DB_*` values in `backend/.env` and make sure the MySQL service is running.

### Optional: demo data
In a second PowerShell window:
```powershell
cd backend
npm run seed
```
This creates one demo account with about 55 sample expenses over 6 months: **demo@example.com / Demo@1234**. It never deletes anything and does nothing if the demo user already exists.

## 4. Start the frontend
Open another PowerShell window:
```powershell
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. Register an account (or log in with the demo account).

The frontend talks to `http://localhost:5000/api` by default. If your backend uses another address, copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_URL`.

## 5. Testing

### Automated API tests
With the backend running:
```powershell
cd backend
npm run test:api
```
It creates two throw-away users and checks: registration, duplicate email, valid/invalid login, expense add/edit/delete, category add/edit/delete (including the safe-delete rules), search/filter/sort, monthly totals, category totals and percentages, budget validation, invalid inputs, missing/invalid tokens, and that **user B can never read, edit or delete user A's data**. Expected final line: `Result: N passed, 0 failed`.

### Postman
1. Postman -> Import -> choose `postman/ExpenseTracker.postman_collection.json`.
2. Run **Auth -> Register** (or **Login** with the demo user). A test script saves the token into the `{{token}}` variable, so the other requests are authorised automatically.
3. Run the Categories, Expenses and Dashboard requests. In **Add expense** set `category_id` to an id returned by **List categories** (default 1 only works for the first registered user).

### Manual UI checklist (for the demo)
- [ ] Register; try the same email again -> error shown
- [ ] Wrong password -> error; correct password -> dashboard
- [ ] Add, edit and delete an expense (delete asks for confirmation)
- [ ] Dashboard cards and both charts change after you add or delete an expense (go back to the Dashboard)
- [ ] Search, category filter, month filter, date range, sorting, Clear filters
- [ ] Add, rename and delete a category; delete one that has expenses -> you must choose where to move them
- [ ] Reports: monthly comparison, highest month, category shares
- [ ] Set a budget below this month's spending -> warning appears
- [ ] Export CSV, dark mode, resize the browser to phone width (hamburger menu)
- [ ] Log out and try to open http://localhost:5173/expenses -> redirected to login

## 6. GitHub setup
```powershell
git init
git add .
git commit -m "Initial commit: Expense Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```
Create the empty repository on github.com first and copy its URL. `.gitignore` already excludes `node_modules` and `.env`, so your database password and JWT secret are never uploaded. Teammates clone the repo and copy `.env.example` to `.env` with their own values.

Team workflow: each member works on a branch (`git checkout -b feature/reports`), pushes it, and opens a pull request into `main`.

## 7. Troubleshooting
| Problem | Fix |
|---|---|
| `Cannot connect to MySQL` | Wrong `DB_USER` / `DB_PASSWORD`, MySQL not running, or schema not created |
| `ER_NOT_SUPPORTED_AUTH_MODE` (older MySQL) | Create a user with `mysql_native_password`, or use MySQL 8.0+ with mysql2 3.x (default setup works) |
| Browser shows "Cannot reach the server" | Backend is not running on port 5000 |
| CORS error in browser console | Add your frontend URL to `CLIENT_URL` in `backend/.env` and restart the backend |
| Port 5000 or 5173 busy | Change `PORT` in `.env` (and `VITE_API_URL` in the frontend) |
| `npm` scripts blocked in PowerShell | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |

See [docs/API.md](docs/API.md) for every endpoint and [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for architecture and viva notes.
