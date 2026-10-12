# FinTrack – Personal Finance Management Platform

FinTrack lets a registered user record income and expenses, group spending by category, set monthly
category budgets, and review dashboards and multi-month reports. The React frontend talks to a
Spring Boot REST API, which stores data in MySQL.

## Verification status (read this first)

The sandbox used to create this project had Java 21 and Node 22, but **no Maven Central access and no
MySQL or Docker**. Because of that:

| Area | Status |
|---|---|
| Frontend unit and component tests (Vitest, 24 tests) | **Executed and passing** |
| Frontend production build (`vite build`) | **Executed and succeeded** |
| Backend Java syntax and project-internal references (`javac` via `jdk.compiler`) | **Executed**: no parse errors; no unresolved project-internal symbols. Third-party types could not be resolved because Maven dependencies were unavailable. |
| Backend unit and integration tests (JUnit 5, Mockito, MockMvc) | **Written, NOT executed.** Run `mvn test` locally. |
| Backend `mvn package` | **Not executed.** |
| Flyway migration against MySQL 8 | **Not executed.** |
| End-to-end browser test against the running stack | **Not executed.** |
| `docker-compose up` | **Not executed.** |

Please run the backend steps below and report any errors. The backend code is written against Spring Boot 3.3.5
and jjwt 0.12.6 but has not been compiled against those libraries.

## Features

- Registration and login with BCrypt password hashing and JWT (HS256) authentication.
- Protected routes in the frontend, and protected endpoints in the backend.
- Transactions: add, edit, delete, filter by type/category/date range, search by title, sort, and paginate.
- Fixed categories; each category belongs to either INCOME or EXPENSE, and the backend rejects mismatches.
- Monthly budgets per expense category, with spent / remaining / percentage and status (OK, WARNING at 80%, EXCEEDED above 100%).
- Dashboard: income, expenses, net savings, expense-by-category chart, income-vs-expense chart, recent transactions, and budget utilization.
- Reports: a month range (up to 24 months) with monthly totals, month-over-month expense change, and category totals.
- Ownership: every transaction and budget query is scoped to the authenticated user's ID. Another user's record returns 404.

## Architecture and technology

- **Frontend:** React 18 (JavaScript), Vite, React Router 6, Axios, Bootstrap 5, Recharts, Vitest and React Testing Library.
- **Backend:** Java 21, Spring Boot 3.3, Spring Web, Spring Data JPA (Hibernate), Spring Security with stateless JWT, Bean Validation, Springdoc OpenAPI, Flyway, MySQL 8.
- **Backend layers:** `controller` → `service` → `repository`. DTOs are used at the API boundary, so JPA entities and password hashes are never returned.
- **Money:** `BigDecimal` with scale 2. **Dates:** `LocalDate` for transaction and budget dates, `Instant` for audit timestamps, stored in UTC.

## Folder structure

```
FinTrack/
  backend/          Spring Boot application (Maven)
    src/main/java/com/fintrack/
      config/        AppConfig, AppProperties (validated JWT settings), SecurityConfig
      security/      JwtService, JwtAuthenticationFilter
      controller/    REST controllers
      service/       Business rules (auth, transactions, budgets, dashboard, reports)
      repository/    Spring Data repositories with user-scoped queries
      entity/        User, Transaction, Budget, Category, TransactionType
      dto/           Request and response records
      exception/     Exception types and GlobalExceptionHandler
      mapper/        Entity-to-DTO mapping
    src/main/resources/
      application.yml
      db/migration/  Flyway SQL
    src/test/        JUnit 5 / Mockito / MockMvc tests
  frontend/         React + Vite application
    src/api/         Axios client and endpoint functions
    src/contexts/    AuthContext (session state, expiry handling)
    src/components/  Reusable UI components
    src/pages/       Login, Register, Dashboard, Transactions, Budgets, Reports, Profile
    src/utils/       Formatting and validation helpers
  docs/             API.md (endpoint reference)
  docker-compose.yml  MySQL 8 for local development
  .env.example        Environment variable template
```

## Prerequisites

- JDK 21
- Maven 3.9+
- Node.js 20+ and npm
- MySQL 8.0 (or Docker to run the provided compose file)

## 1. Set up MySQL

**Option A – Docker:**

```bash
cp .env.example .env          # edit passwords and JWT_SECRET first
docker compose up -d mysql
```

**Option B – Local MySQL:**

```sql
CREATE DATABASE fintrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fintrack_user'@'localhost' IDENTIFIED BY 'change-me-db-password';
GRANT ALL PRIVILEGES ON fintrack.* TO 'fintrack_user'@'localhost';
```

Flyway creates the tables automatically on first start.

## 2. Configure environment variables

The backend reads these variables. It will not start without a valid `JWT_SECRET`.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DB_HOST` | no | `localhost` | MySQL host |
| `DB_PORT` | no | `3306` | MySQL port |
| `DB_NAME` | no | `fintrack` | Database name |
| `DB_USERNAME` | yes | – | Database user |
| `DB_PASSWORD` | yes | – | Database password |
| `JWT_SECRET` | **yes** | – | Signing key, at least 32 characters. Generate with `openssl rand -base64 48`. |
| `JWT_EXPIRATION_MINUTES` | no | `60` | Token lifetime |
| `CORS_ALLOWED_ORIGIN` | no | `http://localhost:5173` | Frontend origin allowed by CORS |

Set them in your shell (for example `export JWT_SECRET=...`) or load them from your own environment tooling.
Never commit real values. `.env` is listed in `.gitignore`.

If a required value is missing or too short, Spring prints a message naming the variable and stops at startup.

## 3. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API listens on `http://localhost:8080`. Swagger UI: `http://localhost:8080/swagger-ui.html`.
The OpenAPI JSON is at `http://localhost:8080/v3/api-docs`.

## 4. Run the frontend

```bash
cd frontend
cp .env.example .env          # set VITE_API_BASE_URL if the backend is not on localhost:8080
npm install
npm run dev
```

Open `http://localhost:5173`. To change the API address, edit `VITE_API_BASE_URL` in `frontend/.env` and restart Vite.
`VITE_CURRENCY` sets the currency used for display (default `USD`).

## 5. Run the tests

**Backend** (uses an in-memory H2 database in MySQL mode, so no MySQL is needed):

```bash
cd backend
mvn test
```

**Frontend:**

```bash
cd frontend
npm test
```

## 6. Production builds

```bash
cd backend && mvn clean package          # produces target/fintrack-backend-1.0.0.jar
cd frontend && npm run build             # produces frontend/dist
```

Serve `frontend/dist` with any static host, and set `VITE_API_BASE_URL` to the public API URL before building.
Set `CORS_ALLOWED_ORIGIN` on the backend to that frontend origin.

## Budget and report rules

- A budget covers one calendar month. It is stored with the first day of the month, and only one budget per category per month is allowed.
- Spent = the sum of that user's EXPENSE transactions in the category dated between the first and last day of the month, inclusive.
- Status: `OK` below 80% used, `WARNING` from 80% up to and including 100%, `EXCEEDED` above 100%.
- Dashboard totals cover the selected month. Recent transactions are the latest five across all months.
- Report expense change compares a month with the previous month in the range, and is blank when the previous month had no expenses.

## Known limitations

- The backend has not been compiled or tested in the environment where this project was created (see the verification table above).
- The JWT is stored in `localStorage`, which is readable by any script running on the page. An HttpOnly cookie with CSRF protection would be stronger for production.
- There is no refresh-token flow. When a token expires the user signs in again.
- Logout only clears the token on the client. Tokens remain valid until they expire, because there is no server-side revocation list.
- Budget category and month cannot be changed after creation. Delete and recreate instead.
- Transaction filtering uses `LIKE` search on title, which is fine for personal data volumes but is not full-text search.
- The frontend bundle is over 500 kB because Recharts is included in full. Code-splitting the report and dashboard pages would reduce it.
- No ESLint configuration is included. The frontend has tests and a build, but no lint step.
- Password reset and email verification are not implemented.

## Troubleshooting

- **"JWT_SECRET must be set" on startup:** export `JWT_SECRET` with at least 32 characters.
- **"Access denied for user" on startup:** check `DB_USERNAME`, `DB_PASSWORD`, and that the MySQL user has privileges on `fintrack`.
- **Frontend shows "Cannot reach the server":** confirm the backend is running on the URL in `VITE_API_BASE_URL`, and that `CORS_ALLOWED_ORIGIN` matches the frontend origin exactly.
- **401 on every page after login:** the token may be expired. Sign in again. Check that `JWT_SECRET` did not change between runs, because tokens signed with an old secret are rejected.
- **Flyway checksum mismatch:** do not edit a migration after it has been applied. Add a new `V2__...sql` file instead, or drop and recreate the local database during development.

## API overview

See `docs/API.md` for request and response examples. All endpoints except `/api/auth/register`, `/api/auth/login`,
and the Swagger paths require `Authorization: Bearer <token>`.
