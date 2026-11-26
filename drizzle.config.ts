import { defineConfig } from 'drizzle-kit'

// `pnpm db:generate` writes migrations from the schema; it needs no database.
// `pnpm db:migrate` applies them to DATABASE_URL (with DATABASE_AUTH_TOKEN for Turso).
export default defineConfig({
  dialect: 'turso',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:.data/dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
})
