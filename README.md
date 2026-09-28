# StealthERP

Monorepo root.

- [`frontend/`](frontend/) — the Neighbourhood Store App (Next.js + Supabase). See [frontend/README.md](frontend/README.md) for setup, environment variables, and the Supabase recreate/recovery procedures.
- [`backend/`](backend/) — reserved for a future standalone backend service. Not in use yet: this app talks to Supabase directly from the browser.
- [`shared/`](shared/) — the `@stealth/shared` npm workspace package: the Zod API contract ([shared/api-contract/](shared/api-contract/)) used by the frontend, ready for a future backend to import too.
