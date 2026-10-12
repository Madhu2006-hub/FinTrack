# FinTrack API reference

Base URL: `http://localhost:8080`. Protected endpoints require `Authorization: Bearer <token>`.
Interactive documentation: `/swagger-ui.html`.

## Error format

Every error uses this shape:

```json
{
  "timestamp": "2026-10-11T06:00:00Z",
  "status": 400,
  "error": "Validation failed",
  "message": "One or more fields are invalid.",
  "fieldErrors": { "amount": "Amount must be greater than zero." }
}
```

Status codes: `400` validation or business-rule failure, `401` missing/invalid/expired token or bad credentials,
`403` forbidden, `404` not found (also returned for another user's record), `409` duplicate.

## Authentication

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "name", "email", "password" }` (password 8–72 chars) | `201` `{ token, tokenType, expiresInSeconds, user }` |
| POST | `/api/auth/login` | `{ "email", "password" }` | `200` `{ token, tokenType, expiresInSeconds, user }` |
| GET | `/api/auth/me` | – | `200` `{ id, name, email }` |

## Categories

| Method | Path | Notes |
|---|---|---|
| GET | `/api/categories?type=INCOME\|EXPENSE` | Returns `{ name, label, type }` entries. `type` is optional. |

## Transactions

| Method | Path | Notes |
|---|---|---|
| GET | `/api/transactions?type&category&from&to&search&page&size&sortBy&direction` | `sortBy`: `date`, `amount`, `title`. Default page size 10, maximum 100. |
| POST | `/api/transactions` | `201`. Body: `{ title, amount, type, category, transactionDate, description? }` |
| GET | `/api/transactions/{id}` | – |
| PUT | `/api/transactions/{id}` | Same body as POST |
| DELETE | `/api/transactions/{id}` | `204` |

Example create request:

```json
{ "title": "Groceries", "amount": 42.75, "type": "EXPENSE", "category": "FOOD", "transactionDate": "2026-10-03", "description": "Weekly shop" }
```

Paged response shape: `{ content, page, size, totalElements, totalPages }`.

## Budgets

| Method | Path | Notes |
|---|---|---|
| GET | `/api/budgets?month=yyyy-MM` | Defaults to the current month. Each item includes `spent`, `remaining`, `percentUsed`, `status`. |
| POST | `/api/budgets` | `201`. Body: `{ category, month, amount }`. Expense categories only. `409` if one already exists. |
| PUT | `/api/budgets/{id}` | Body: `{ amount }` |
| DELETE | `/api/budgets/{id}` | `204` |

## Dashboard

| Method | Path | Notes |
|---|---|---|
| GET | `/api/dashboard?month=yyyy-MM` | Returns `totalIncome`, `totalExpenses`, `netSavings`, `expenseByCategory`, `recentTransactions`, and `budgets` |

## Reports

| Method | Path | Notes |
|---|---|---|
| GET | `/api/reports/summary?from=yyyy-MM&to=yyyy-MM` | Maximum 24 months. Returns monthly totals, `expenseChangePercent`, and category totals for the range. |
