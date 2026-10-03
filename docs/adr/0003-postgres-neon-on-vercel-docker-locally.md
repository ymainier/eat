# Postgres: Neon on Vercel, Docker locally

The app is deployed on Vercel to get started quickly and must stay on free tiers. We use Postgres everywhere: Neon (via the Vercel Marketplace, free tier) in deployed environments and a Postgres Docker container locally and in tests, accessed through Drizzle ORM so the same schema and migrations run in both. We rejected SQLite/Turso-style options because local and deployed environments would then differ in either engine or tooling, and Postgres keeps the door open for any later host.

## Consequences

- Vercel's Hobby plan is for non-commercial use only; turning this into a product means a paid plan or another host.
- Neon's free tier suspends idle databases, so the first request after a quiet period is slower.
