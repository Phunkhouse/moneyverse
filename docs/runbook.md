# Runbook

How this project is deployed and operated. Only verified commands; anything not yet tried is marked **unverified**.

## Environments

- **Local:** `pnpm dev` with `.env.local` (copy `.env.example`; set `BETTER_AUTH_SECRET` to the output of `openssl rand -base64 32`). The database is the file `.data/dev.db`, created by `pnpm db:migrate`. Verified 2026-11-26.
- **Production:** Vercel Hobby (region `fra1`) and a Turso database, on a subdomain. **Not set up yet**; the steps below are the plan and are unverified until the first deploy. Vercel deploys only `main` and branches named `preview/…` (`vercel.json`); commits that change only `docs/` or Markdown files skip the build.

## First deploy (owner, once)

Unverified. Choose the production subdomain first: passkeys are bound to it, and changing it later means new invites for everyone ([ADR 0004](decisions/0004-invite-only-passkey-sign-in.md)).

1. **Turso:** create a database in a region near Frankfurt, then get its URL (`libsql://…`) and create an auth token for it, in the Turso dashboard or CLI. Record the free-tier limits you see that day for H-3 ([assumptions O-04](assumptions.md)).
2. **Migrate** from your machine, with the values only in that command's environment:

   ```sh
   DATABASE_URL='libsql://…' DATABASE_AUTH_TOKEN='…' pnpm db:migrate
   ```

3. **Vercel:** import `Phunkhouse/moneyverse` (framework Next.js). Under Settings → Environment Variables, for **Production** only, set `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET` (a new `openssl rand -base64 32`, not the local one) and `BETTER_AUTH_URL` (`https://<subdomain>`). Add the subdomain under Settings → Domains and create the DNS record Vercel shows.
4. **Deploy** `main` (a redeploy after setting the variables). Check: `https://<subdomain>/` redirects to `/prihlaseni`, and the response has the security headers from `next.config.ts`.
5. **Invite yourself**, with the production values only in that command's environment:

   ```sh
   DATABASE_URL='libsql://…' DATABASE_AUTH_TOKEN='…' BETTER_AUTH_SECRET='…' BETTER_AUTH_URL='https://<subdomain>' pnpm invite:create --email <you> --name <name>
   ```

   Open the printed link on your phone, create the passkey, and check that you land signed in. Then sign out and sign in again with the passkey.
6. Write the actual steps, the date and anything that differed back into this file.

## Deploy

Merging to `main` deploys to production automatically. If the PR adds a file in `drizzle/`, run `pnpm db:migrate` against production (step 2) **before** merging; the PR says so in an `IMPORTANT` block. Check a deploy by opening the site and signing in.

## Roll back

In Vercel, promote the previous production deployment (Deployments → ⋯ → Promote to Production). Unverified. A rollback does not undo a database migration: migrations must stay compatible with the previous release, or the rollback needs a new migration.

## Invites and lost passkeys

- New user: `pnpm invite:create --email <email> --name <name>`.
- New device or lost passkey: `pnpm invite:create --email <email> --existing`.
- Links are single use and valid for 24 hours. The script prints the link once; send it over a private channel. Against production, only the owner runs it, with the variables inline as in step 5.

## Secrets

Names only; never values. None is ever committed or printed in CI.

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel (Production), owner's shell for migrations and invites | Turso database URL |
| `DATABASE_AUTH_TOKEN` | same | Turso auth token |
| `BETTER_AUTH_SECRET` | Vercel (Production), owner's shell for invites | Signs cookies and hashes; changing it signs everyone out |
| `BETTER_AUTH_URL` | Vercel (Production), owner's shell for invites | The app's origin; also the passkey relying party |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub Actions repository secret | `@claude review`; set 2026-11-26 |

## Backup and restore

Not applicable yet: there is no real data. Before your first real entry, a scheduled backup and a tested restore must exist (risk trigger "has real users"). Backups must not go through GitHub Actions artifacts, because the repository is public.

## Incidents

Not set up yet. Errors are in the Vercel project's logs. First checks: the site redirects to `/prihlaseni`; `/api/auth/get-session` answers; the Turso database is reachable.
