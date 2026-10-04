# Eat

Weekly meal planning for our Household. See `CONTEXT.md` for the domain language and `docs/adr/` for the decisions behind the design.

## Layout

- `src/domain` — domain rules (Meal Week, Household settings, …). Pure TypeScript.
- `src/application` — use cases, the seam every client calls. Depends on the `Clock` port and on Postgres through Drizzle.
- `src/db` — Drizzle schema, migrations runner and seed.
- `src/email` — Email sender adapters: Resend, and an outbox table for tests and local development.
- `src/auth` — Better Auth configuration (magic links, allow list, joining the Household on first sign-in).
- `src/app`, `src/web` — the Next.js web app, a thin client of the application layer. `src/web/application.ts` is its composition root.

None of these except `src/app` and `src/web` may import Next.js or React (ADR-0002); ESLint enforces it.

## Running locally

Requires Node 24 and Docker (e.g. `colima start`).

```sh
npm install
cp .env.example .env
npm run db:up        # Postgres in Docker, with the eat, eat_test and eat_test_unit databases
npm run db:migrate   # apply migrations to the database in DATABASE_URL
npm run db:seed      # create the Household (Saturday start day, Meal Count 14)
npm run dev          # http://localhost:3000
```

In `.env`, set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and put your email in `ALLOWED_EMAILS` (comma-separated). Without `RESEND_API_KEY`, sign-in emails are not sent but stored in the `email_outbox` table: after asking for a link, run `npm run email:last` and open the link it prints.

After changing `src/db/schema.ts`, run `npm run db:generate` to write a new migration under `drizzle/`.

## Tests

Both suites need the Docker database running (`npm run db:up`).

```sh
npm test             # Vitest: application-layer use cases against eat_test_unit, with a fixed Clock
npm run test:e2e     # Playwright: the web app against eat_test
npm run typecheck
npm run lint
```

- **Vitest** migrates `eat_test_unit` once, then truncates it before each test.
- **Playwright** signs in through the real magic-link flow only in `e2e/sign-in.spec.ts`, reading the link from the outbox; every other test uses the `signIn` fixture, which injects a session cookie.
- **Playwright** starts its own dev server on port 3100 (in `.next-e2e`, so it can run beside `npm run dev`), migrates `eat_test` on startup and truncates and re-seeds it before each test, with a single worker. The app's clock is pinned to Monday 5 Oct 2026 through `EAT_CLOCK_NOW`, which is ignored in production.
