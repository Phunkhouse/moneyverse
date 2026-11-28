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

4. **Migrate:** `pnpm db:migrate:prod`. In any terminal where the Turso CLI is logged in, it asks the CLI for the database URL and a token valid for one day (the CLI's shortest), so step 3's variables are not needed for this step; if both are set in the terminal, it uses them instead. It prints `Migrating PRODUCTION database: moneyverse-….turso.io` and ends with `✓ N migrations applied; all … tables present.` (Since 2026-11-28. Before that, plain `pnpm db:migrate` silently migrated the local file when the variables were missing: on the first deploy, and again for PRs #5 and #6, which broke every screen after PR #7.)
5. **Vercel:** import `Phunkhouse/moneyverse` (framework Next.js). Settings → Environment Variables, **Production** only: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (copy each with `echo "$NAME"`, then clear the terminal). Settings → Domains: add the domain and create the CNAME record Vercel shows at the domain's DNS provider (with Cloudflare: DNS only, not proxied). Redeploy after setting the variables.
6. **Check:** the site redirects to `/prihlaseni` and responses carry the security headers from `next.config.ts`.
7. **Invite yourself** in the same terminal, open the link on the device that should hold the passkey, create it, and check you land signed in:

   ```sh
   pnpm invite:create --email <you> --name "<name>"
   ```

   On 2026-11-27 the passkey was created on the owner's Mac, and signing in also worked on the phone.
8. `unset DATABASE_URL DATABASE_AUTH_TOKEN BETTER_AUTH_SECRET BETTER_AUTH_URL`

## Deploy

Merging to `main` deploys to production automatically. If the PR adds a file in `drizzle/`, run `pnpm db:migrate:prod` **before** merging (any terminal with the Turso CLI logged in) and check that it ends with all tables present; the PR says so in an `IMPORTANT` block. Check a deploy by opening the site and signing in.

## Exchange rates

- **Daily:** Vercel Cron calls `/api/cron/rates` once a day at 15:00 UTC (Hobby runs it somewhere in that hour; `vercel.json`). It needs `CRON_SECRET` in Vercel's Production environment variables; without it the route answers 503 and conversions after the last checked day are marked estimated. Check a run in the Vercel project's Cron Jobs or logs.
- **History:** `pnpm rates:backfill --year 2025 --year 2026` loads whole years from ČNB. Safe to repeat. Against production, the owner runs it with `DATABASE_URL` and `DATABASE_AUTH_TOKEN` set as in step 3 of the first deploy. Verified locally 2026-11-27 (sync of the current week against the live ČNB API); the backfill against ČNB itself is unverified.

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
| `CRON_SECRET` | Vercel (Production) | Authorizes Vercel Cron on `/api/cron/rates`; letters and digits, e.g. `openssl rand -hex 24` |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub Actions repository secret | `@claude review`; set 2026-11-26 |

Production values set in Vercel on 2026-11-27. The first deploy may have created more than one Turso token (a shell was closed and the values set again). To revoke them all, invalidate the database's tokens in Turso (CLI `turso db tokens invalidate moneyverse`, unverified), then put a new token in Vercel and redeploy.

## Backup and restore

Required before the first real money entry (risk trigger "has real users"). Turso's free plan keeps only 1 day of point-in-time history and cannot restore a deleted database, so it is not a backup on its own. Backups never go through GitHub (the repository is public) and never into this repository.

**Back up** (owner, on the Mac with the Turso CLI logged in):

```sh
pnpm db:backup
```

- It dumps the production database with `turso db shell moneyverse .dump` and leaves out live sessions, WebAuthn challenges and rate-limit counters (`TRANSIENT_TABLES` in `src/server/db/backup.ts`). The file holds no sign-in tokens, but it holds all financial data.
- It saves `moneyverse-YYYY-MM-DDTHH-MM.sql` (readable by you only) to `$MONEYVERSE_BACKUP_DIR` or `~/Documents/moneyverse-backups`, and refuses a folder inside the repository.
- It then **restores the file into a throwaway local database** and checks that every table exists and the migrations match the code. Only a file that passes counts as a backup; it prints row counts, never contents.
- **When:** weekly while the app is in use, and before every `pnpm db:migrate:prod`.
- **Where:** keep the folder on the Mac's encrypted disk (FileVault on), and a second copy somewhere off the Mac that is encrypted, such as an encrypted disk image on an external drive or in your own cloud storage. Keep at least the last 4 weekly files. (Proposal; the owner chooses the second place.)

**Cloud backups** ([ADR 0006](decisions/0006-cloud-backups.md)): a Cloudflare Worker backs up production every day at 02:30 UTC to the private R2 bucket `moneyverse-backups`, encrypted with your public key; R2 deletes them after 30 days. The manual `pnpm db:backup` above stays as a fallback.

*Setup, once* (commands with `pnpm dlx wrangler@4.162.0`, shortened to `wrangler` below; run from `workers/backup/` unless noted):

1. Cloudflare dashboard: open R2 and enable it (it may ask for a payment method even for the free tier).
2. `wrangler login`
3. `wrangler r2 bucket create moneyverse-backups`
4. `wrangler r2 bucket lifecycle add moneyverse-backups expire-30-days --expire-days 30`, then `wrangler r2 bucket lifecycle list moneyverse-backups` shows the rule.
5. In the repository root: `pnpm backup:keygen`. It writes the private key to `~/Documents/moneyverse-backups/backup-private-key.jwk`. **Copy that file's contents into your password manager now**; without it no cloud backup can be opened.
6. Secrets (each command asks for the value; paste it, nothing is echoed):
   - `turso db show moneyverse --http-url | wrangler secret put TURSO_DATABASE_URL`
   - `turso db tokens create moneyverse --read-only | wrangler secret put TURSO_READ_TOKEN` (read-only; it cannot change the database)
   - `wrangler secret put BACKUP_PUBLIC_KEY < ~/Documents/moneyverse-backups/backup-public-key.jwk`
7. `wrangler deploy`
8. After the first 02:30 UTC run: Cloudflare dashboard → Workers → moneyverse-backup → Logs (or Cron Events) shows "Stored moneyverse-….sql.enc". Then check it as below.

*Check or restore a cloud backup:*

1. `wrangler r2 object list moneyverse-backups --remote` (or the dashboard's R2 bucket view) to pick a file.
2. `wrangler r2 object get moneyverse-backups/<file> --remote --file ~/Documents/moneyverse-backups/<file>`
3. In the repository root: `pnpm backup:decrypt ~/Documents/moneyverse-backups/<file>`. It writes the `.sql` next to it (without sessions) and runs the local restore check.
4. `pnpm db:restore-drill ~/Documents/moneyverse-backups/<file without .enc>` for the full Turso drill, or the restore steps below.

**Check an older file** any time: `pnpm db:restore-check <file.sql>`.

**Restore drill:** `pnpm db:restore-drill <file.sql>` restores a backup into a temporary Turso database (`moneyverse-restore-drill`) the same way as a real restore, compares every table's row count with the file, and destroys the temporary database. Run it after the first backup, after any change to the schema, and every few months.

- **2026-11-28 (owner):** the first backup restored with every row through the shell route below (user 1, passkey 1, exchange rates 12, migrations 3). `turso db create --from-dump` restored the tables but **lost the user and passkey rows**, so it is not used.

**Restore into Turso** (the route the drill uses):

1. `turso db create moneyverse-restore` (an empty database, in the default group near Frankfurt).
2. `turso db shell moneyverse-restore < <file.sql>`: loads the backup.
3. `DATABASE_URL="$(turso db show moneyverse-restore --url)" DATABASE_AUTH_TOKEN="$(turso db tokens create moneyverse-restore --expiration 1d)" pnpm db:migrate:prod`: it should apply nothing new and report all tables present.
4. Create a long-lived token for the app (`turso db tokens create moneyverse-restore`), set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` (Production) in Vercel to the restored database, and redeploy.
5. Sign in again with your passkey (sessions are not in backups).

## Incidents

No alerting yet. Errors are in the Vercel project's logs; a screen that fails shows "Něco se pokazilo" with a code (`Kód chyby`) that matches the log entry's `digest`. First checks: the site redirects to `/prihlaseni`; `/api/auth/get-session` answers; the Turso database is reachable; `turso db shell moneyverse ".tables"` lists the tables in `src/server/db/target.ts`.

- **2026-11-28, every app screen failed after PR #7:** `no such table: money_account`. The PR #5 and #6 migrations had gone to the local file because `DATABASE_URL` was not set in the terminal. Fixed by migrating Turso; prevented by `pnpm db:migrate:prod`, and a failing quick-add load no longer takes every page down.
