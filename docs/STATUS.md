# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: project setup and sign-in (PR #1), first deploy recorded (PR #2), esbuild override (PR #3), design tokens, app shell, theme, kit part 1 and manifest (PR #4).
- Deployed at https://money.david-krapka.eu (Vercel Hobby `fra1`, Turso free plan). The owner's passkey works on the Mac and the phone; the WebAuthn ceremony has no automated test.
- In review (PR #5, branch `feat/money-rules`): the ledger in `src/server/money/` ([ADR 0005](decisions/0005-ledger-data-model.md)):
  - Accounts of seven types, categories, idempotent transactions with transfers that keep both amounts, monthly values with carried months.
  - Archived accounts and categories take no new entries; edits of existing ones still work.
  - Month-end balances, net worth by kind of account, and spending per category against earlier months, all in CZK at the day's ČNB rate, marked when estimated.
  - ČNB rates through a daily Vercel Cron and `pnpm rates:backfill`.
  - A favicon (`src/app/favicon.ico`). The site had no linked icon since PR #4, because `metadata.icons` hid the file icons. The Apple icon is now `src/app/apple-icon.png`.
- The rules have tests for AC-2, AC-5, AC-8, AC-9 and AC-15 (except budgets, R-14). The criteria stay unticked until their screens and walkthroughs exist.
- No screen uses the ledger yet; the accounts and categories PR is next.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #5 is merged: the accounts and categories screens (R-4, R-7), BACKLOG "Next", first item.

## Blockers and open questions

- Owner, for PR #5, before merging: run `pnpm db:migrate` against production; add `CRON_SECRET` to Vercel (Production). Optional: `pnpm rates:backfill` for past years (runbook "Exchange rates").
- Owner, before the first real money entry: backups with a tested restore (runbook "Backup and restore").
- Owner, if not done: branch protection on `main` requiring `check`.
- On 2026-12-27: check H-3's idle rule and read Vercel Hobby's limits.
- New assumption O-14 (investment balances ignore contributions until the next monthly value) waits for the owner or H-4.
- Open questions Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- Command: `pnpm verify` (format:check, lint, typecheck, 113 tests, build), including the PR #5 review fixes; `pnpm db:generate` shows no drift.
- Live checks on 2026-11-27:
  - Rate sync against the ČNB API into the local database: four days stored; the 26 November EUR rate of 24,455 matches ČNB.
  - `/api/cron/rates` on `pnpm dev`: 401 with a wrong secret, 200 with the right one.
  - `/favicon.ico`, `/icon.svg` and `/apple-icon.png` are linked in the page head and served.
- Revision: branch `feat/money-rules` at `f69cc52` plus the review fixes, uncommitted at the time.
- Working tree: the PR #5 changes only.
- Result: passed.
- Not run:
  - The 503 answer without `CRON_SECRET`.
  - A Vercel Cron run.
  - The backfill against ČNB.
  - Foreign keys enforced on Turso. They are enforced on local libSQL, as tested; check after the migration.
  - Přehled while signed in (owner check from PR #4).
  - Vercel rollback.
