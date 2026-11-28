import { defineConfig } from 'drizzle-kit'

// `pnpm db:generate` writes migrations from the schema; it needs no database.
// Migrations are applied by scripts/db-migrate.ts (`pnpm db:migrate`, `pnpm db:migrate:prod`), which
// check the target first; do not run `drizzle-kit migrate` or `push` directly.
export default defineConfig({
  dialect: 'turso',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:.data/dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
})
