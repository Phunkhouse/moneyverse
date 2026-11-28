# 0006. Daily encrypted backups on Cloudflare R2

Date: 2026-11-28  
Status: accepted (owner asked for automated cloud backups with about one month of retention, 2026-11-28)

## Context

The risk trigger "has real users" needs backups with a tested restore. `pnpm db:backup` (PR #13) works but depends on the owner remembering to run it on the Mac. Turso's free plan keeps 1 day of point-in-time history and cannot restore a deleted database; longer history is paid (C-1: free to run). The repository is public, so backups may not pass through GitHub Actions. The owner already uses Cloudflare for the domain's DNS.

## Decision

- A **Cloudflare Worker** (`workers/backup/`) runs once a day on a cron trigger (02:30 UTC).
- It fetches `GET /dump` from the production database with a **read-only** Turso token (documented in Turso's SQL over HTTP reference, read 2026-11-28; `.dump` format).
- It checks that the dump starts its transaction and ends with `COMMIT;`, **encrypts it with the owner's public key** (RSA-OAEP 4096 wrapping an AES-256-GCM key, WebCrypto) and stores `moneyverse-YYYY-MM-DDTHH-MM.sql.enc` in a private **R2 bucket** (`moneyverse-backups`).
- The Worker never has the private key: someone with access to the Cloudflare account or the bucket sees only ciphertext. The owner keeps the private key in a password manager and on the Mac.
- An R2 lifecycle rule deletes backups after **30 days** (owner's choice; R2 removes expired objects typically within 24 hours).
- Restoring stays manual: download, `pnpm backup:decrypt` (which also strips sessions, challenges and rate limits and runs the local restore check), then `pnpm db:restore-drill` or the runbook's restore steps.
- The Worker is deployed by the owner with a pinned `wrangler` (`pnpm dlx wrangler@4.162.0`), not from CI, and has no public URL.
- `pnpm db:backup` stays as the manual fallback.

## Alternatives considered

- **GitHub Actions to an artifact or another store:** ruled out; the repository is public.
- **Vercel Cron and Vercel Blob:** Blob objects are reachable by URL, and it would add load to the Hobby project that serves the app.
- **Turso's longer point-in-time restore:** a paid plan.
- **launchd on the Mac running `pnpm db:backup`:** no new account, but only runs while the Mac is awake and keeps the backups on one machine.
- **Building the dump in the Worker from queries:** more code and CPU; a Free cron run has 10 ms of CPU. Fetching Turso's own dump keeps the Worker's work to encryption (about 1 ms for 2 MB measured locally in Node).

## Consequences

- A second deployable and a Cloudflare account with R2 enabled; Cloudflare's free tier covers it (R2: 10 GB-month, 1 million Class A operations a month, free egress; Workers Free: cron triggers, 10 ms CPU per run; read 2026-11-28).
- Losing the private key makes every cloud backup unreadable: it is stored in the password manager, and `pnpm backup:keygen` refuses to overwrite it.
- Backups are only 30 days deep; a problem noticed later is covered by the user's export file (AC-13) and any local `pnpm db:backup` files.
- Failures show as failed runs in the Worker's Cron Events and logs; there is no alert yet (Cloudflare notifications could add one).
- If Turso changes or removes `/dump`, the Worker fails loudly and the manual backup still works.
