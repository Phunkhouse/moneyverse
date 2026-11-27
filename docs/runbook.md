# Runbook

How this project is deployed and operated. Only verified commands; anything not yet tried is marked **unverified**.

## Environments

- **Local:** `pnpm dev` with `.env.local` (copy `.env.example`; set `BETTER_AUTH_SECRET` to the output of `openssl rand -base64 32`). The database is the file `.data/dev.db`, created by `pnpm db:migrate`. Verified 2026-11-26.
- **Production:** https://money.david-krapka.eu on Vercel Hobby (region `fra1`), with the Turso database `moneyverse` on the free plan. First deployed 2026-11-27 by the owner. Vercel deploys only `main` and branches named `preview/…` (`vercel.json`); commits that change only `docs/` or Markdown files skip the build.

## First deploy (done 2026-11-27)

Done once by the owner; kept here for a rebuild or a move. Steps 2, 3, 5 and 7 were verified on 2026-11-27; the dashboard steps are as the owner did them, not re-checked by an agent. Choose the domain before step 5: passkeys are bound to it, and changing it later means new invites for everyone ([ADR 0004](decisions/0004-invite-only-passkey-sign-in.md)).

1. **Turso CLI.** `brew install tursodatabase/tap/turso` needs Homebrew tap trust; both taps belong to Turso's GitHub organizations (checked 2026-11-27). Trust only the two formulas, then install:

   ```sh
   brew trust --formula libsql/sqld/sqld && brew trust --formula tursodatabase/tap/turso && brew install tursodatabase/tap/turso
   turso auth login
   ```

2. **Database**, in a region near Frankfurt (`turso db locations` lists them):

   ```sh
   turso db create moneyverse --location <location-id>
   ```

3. **Production values in one terminal**, never printed or in history. Keep this terminal open until step 7; a new `BETTER_AUTH_SECRET` after step 4 would not match Vercel's (if lost, copy it back from Vercel's environment variables).

   ```sh
   nvm use
   export DATABASE_URL="$(turso db show moneyverse --url)" DATABASE_AUTH_TOKEN="$(turso db tokens create moneyverse)"
   export BETTER_AUTH_SECRET="$(openssl rand -base64 32)" BETTER_AUTH_URL="https://money.david-krapka.eu"
   ```

4. **Migrate:** `pnpm db:migrate`. Check that its `url:` line shows `libsql://moneyverse-…`. If it shows `file:.data/dev.db`, `DATABASE_URL` is not set in this shell and the migration went to the local file (this happened on the first try; the invite script then failed with `no such table: user`).
5. **Vercel:** import `Phunkhouse/moneyverse` (framework Next.js). Settings → Environment Variables, **Production** only: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (copy each with `echo "$NAME"`, then clear the terminal). Settings → Domains: add the domain and create the CNAME record Vercel shows at the domain's DNS provider (with Cloudflare: DNS only, not proxied). Redeploy after setting the variables.
6. **Check:** the site redirects to `/prihlaseni` and responses carry the security headers from `next.config.ts`.
7. **Invite yourself** in the same terminal, open the link on the device that should hold the passkey, create it, and check you land signed in:

   ```sh
   pnpm invite:create --email <you> --name "<name>"
   ```

   On 2026-11-27 the passkey was created on the owner's Mac, and signing in also worked on the phone.
8. `unset DATABASE_URL DATABASE_AUTH_TOKEN BETTER_AUTH_SECRET BETTER_AUTH_URL`

## Deploy

Merging to `main` deploys to production automatically. If the PR adds a file in `drizzle/`, run `pnpm db:migrate` against production (steps 3 and 4 of the first deploy, checking the `url:` line) **before** merging; the PR says so in an `IMPORTANT` block. Check a deploy by opening the site and signing in.

## Roll back

In Vercel, promote the previous production deployment (Deployments → ⋯ → Promote to Production). Unverified. A rollback does not undo a database migration: migrations must stay compatible with the previous release, or the rollback needs a new migration.

## Invites and lost passkeys

- New user: `pnpm invite:create --email <email> --name <name>`.
- New device or lost passkey: `pnpm invite:create --email <email> --existing`.
- Links are single use and valid for 24 hours. The script prints the link once; send it over a private channel. Against production, only the owner runs it, with the variables set as in step 3 of the first deploy. A second passkey for the same account: `--existing`.

## Secrets

Names only; never values. None is ever committed or printed in CI.

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel (Production), owner's shell for migrations and invites | Turso database URL |
| `DATABASE_AUTH_TOKEN` | same | Turso auth token |
| `BETTER_AUTH_SECRET` | Vercel (Production), owner's shell for invites | Signs cookies and hashes; changing it signs everyone out |
| `BETTER_AUTH_URL` | Vercel (Production), owner's shell for invites | The app's origin; also the passkey relying party |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub Actions repository secret | `@claude review`; set 2026-11-26 |

Production values set in Vercel on 2026-11-27. The first deploy may have created more than one Turso token (a shell was closed and the values set again). To revoke them all, invalidate the database's tokens in Turso (CLI `turso db tokens invalidate moneyverse`, unverified), then put a new token in Vercel and redeploy.

## Backup and restore

Not set up. Production holds only the owner's account and passkey, no financial data yet. Before the first real entry, a scheduled backup and a tested restore must exist (risk trigger "has real users"). Turso's free plan includes point-in-time restore for 1 day and cannot restore a deleted database (plan page, 2026-11-27), so it is not a backup on its own. Backups must not go through GitHub Actions artifacts, because the repository is public.

## Incidents

Not set up yet. Errors are in the Vercel project's logs. First checks: the site redirects to `/prihlaseni`; `/api/auth/get-session` answers; the Turso database is reachable.
