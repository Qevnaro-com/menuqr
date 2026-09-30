# MenuQR API

The API stores client profiles and embedded menu items in MongoDB. Admin sessions are also stored in MongoDB and expire automatically after eight hours. On an empty database, the API imports non-seed records from `backend/data/clients.json` once if that file exists; otherwise the collection starts empty. It never overwrites a non-empty collection. Existing browser `menuqr.clients` data is imported once when the admin first loads clients.

## Run locally

Install backend dependencies and configure MongoDB once:

```powershell
Push-Location .\backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and set `MONGODB_URI` to your local MongoDB URI or MongoDB Atlas connection string. In Atlas, create a database user and allow your IP address in Network Access. Keep `.env` private; it is git-ignored.

Open two terminals from the repository root:

```powershell
Push-Location .\backend
npm run server
```

```powershell
Push-Location .\frontend
npm run dev
```

Vite forwards `/api` requests to `http://127.0.0.1:3001`. The backend binds to loopback and is intended for local development.
The built-in admin password is `MenuQR@2026!`. Set `ADMIN_PASSWORD` in `backend/.env` to override it. Successful logins use an HttpOnly, eight-hour MongoDB session; failed login attempts are temporarily rate-limited.

## Routes

- `GET /api/health` reports API status and saved-client count.
- `GET /api/auth/session` checks the current admin session.
- `POST /api/auth/login` starts a session with `{ "password": "..." }`.
- `POST /api/auth/logout` ends the current session.
- `GET /api/admin/clients` lists client records for the admin UI.
- `GET /api/admin/clients/:id` fetches one client.
- `POST /api/admin/clients` creates a client.
- `PUT /api/admin/clients/:id` updates a client.
- `DELETE /api/admin/clients/:id` removes a client.
- `GET /api/public/menus/:slug` returns active customer-facing menu data without owner contact or billing details.

All `/api/admin/*` routes require a valid admin session. The built-in password is for local development; set a private `ADMIN_PASSWORD` and use HTTPS before deployment. Use a restricted MongoDB user and an IP allowlist for Atlas. Production deployments should additionally use a managed identity provider and review session-secret/password policies.