# MenuQR API

The API stores client profiles and menu items in `backend/data/clients.json`. On the first start it creates that file with sample restaurants, a dhaba, and a cafe. Changes remain on disk between restarts. Existing `menuqr.clients` records in a browser are imported once when the admin first loads the client list.

## Run locally

Open two terminals from `frontend/`:

```powershell
npm run server
npm run dev
```

Vite forwards `/api` requests to `http://127.0.0.1:3001`. The API binds to loopback and is intended for local development.
The built-in admin password is `MenuQR@2026!`. Set `ADMIN_PASSWORD` before starting the server to override it. Successful logins use an HttpOnly, eight-hour session cookie; failed login attempts are temporarily rate-limited.

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

All `/api/admin/*` routes require a valid admin session. The built-in password is for local development; set a private `ADMIN_PASSWORD` and use HTTPS before deployment. The session store and JSON data file are local-development storage, not substitutes for a production identity provider and managed database.