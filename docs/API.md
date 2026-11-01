# API Documentation

Base URL: `http://localhost:5000/api` · All bodies are JSON.
Protected routes need the header `Authorization: Bearer <token>` (the token comes from register/login).

Errors always look like `{ "message": "..." }` and validation errors add `"errors": ["...", "..."]`.

| Status | Meaning |
|---|---|
| 200 / 201 | Success / created |
| 400 | Validation failed or bad input |
| 401 | Missing, invalid or expired token; wrong login |
| 404 | Record not found (or it belongs to another user) |
| 409 | Duplicate (email, category name) or category still has expenses |
| 500 | Server error |

## Authentication

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `name`, `email`, `password` | Password: 8+ chars with a letter and a number. Creates the 10 default categories. Returns `token` + `user`. 409 if the email exists. |
| POST | `/auth/login` | `email`, `password` | Returns `token` + `user`. 401 on wrong credentials. |
| GET | `/auth/me` | - | Returns the logged-in `user`. |

## Expenses (protected)

Expense body: `title` (1-150 chars), `amount` (> 0), `category_id` (one of your categories), `expense_date` (`YYYY-MM-DD`), `description` (optional, max 1000).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/expenses` | Create an expense. |
| GET | `/expenses` | List your expenses. Returns `{ count, total, expenses }`. |
| GET | `/expenses/:id` | One expense. |
| PUT | `/expenses/:id` | Replace the expense fields. |
| DELETE | `/expenses/:id` | Delete an expense. |

Query parameters for `GET /expenses` (all optional, can be combined):
`search` (title contains) · `category_id` · `month` (`YYYY-MM`) · `from` and `to` (`YYYY-MM-DD`) · `sort` = `date_desc` (default), `date_asc`, `amount_desc`, `amount_asc`.

## Categories (protected)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/categories` | Body `{ "category_name": "Gym" }`. 409 if you already have that name. |
| GET | `/categories` | Your categories with `expense_count` and `total_spent`. |
| PUT | `/categories/:id` | Rename. Body `{ "category_name": "..." }`. |
| DELETE | `/categories/:id` | Empty category: deleted. Category with expenses: **409** `CATEGORY_HAS_EXPENSES` unless you add `?reassign_to=<otherCategoryId>`; then the expenses are moved to that category and the category is deleted in one transaction. Expenses are never deleted. |

## Dashboard (protected)

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/dashboard/summary` | `total_expenses`, `current_month_expenses`, `total_transactions`, `top_category`, `monthly_budget`, `recent_transactions` (5 latest) |
| GET | `/dashboard/monthly` | `months` (last 12 months, zero-filled: `month`, `total`, `transactions`) and `highest_month` |
| GET | `/dashboard/categories` | `grand_total`, `highest_category`, `categories` (`name`, `total`, `transactions`, `percentage`) |
| PUT | `/dashboard/budget` | Body `{ "monthly_budget": 15000 }` (0 removes the budget). Optional feature. |

## Security notes
- Passwords are hashed with bcryptjs (10 salt rounds); the hash is never returned by any endpoint.
- Every SQL statement uses `?` placeholders (parameterized queries) and filters by `user_id` from the verified token, never from the request body.
- Another user's record returns 404, so its existence is not revealed.
- CORS only allows the origins listed in `CLIENT_URL`.
