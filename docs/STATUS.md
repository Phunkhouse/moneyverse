# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: PRs #1 to #9 (sign-in, app shell, money rules and ČNB rates, accounts and categories, quick add with Undo and the transaction list, Playwright and axe, guarded production migrations and Czech error pages).
- Deployed at https://money.david-krapka.eu. Production has all 3 migrations; `pnpm db:migrate:prod` gets the Turso URL and a one-day token from the logged-in CLI.
- In review (PR #10, branch `feat/month-values`): monthly investment values (R-8, W-5, AC-6).
  - **One sheet:** every active investment account for last month or this month. An empty field keeps carrying the last value.
  - **Reminder on Přehled:** shown once last month's values are missing.
  - **Where to enter:** a card on Účty, and on each investment account's page, which also shows the last 12 months, carried months marked "převzato".
  - **Undo** works through the app-wide toast, which quick add now shares.
  - **Tests:** e2e and axe cover it.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #10 is merged: the dashboard and charts (AC-7, R-10 to R-12), BACKLOG "Next", first item. H-4 (6 to 12 months of the owner's real values) can start once there is a backup.

## Blockers and open questions

- **Owner, before the first real money entry, and so before H-1:** backups with a tested restore (runbook "Backup and restore").
- **Owner:** confirm the contrast changes in `docs/design/README.md`.
- **Owner, still unconfirmed:**
  - `turso db shell moneyverse "PRAGMA foreign_keys"` prints `1`.
  - `CRON_SECRET` is set in Vercel.
  - The `e2e` check is required in branch protection (optional).
- **On 2026-12-27:** check H-3's idle rule and read Vercel Hobby's limits.
- **Waiting for the owner or H-4:** O-14.
- **Open questions:** Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- **Commands:**
  - `pnpm verify` passed: format:check, lint, typecheck, unit tests and the build.
  - `pnpm e2e` passed: 31 tests, including AC-6 (enter last month's value, the current month carried, Undo, an invalid value refused) and axe on the values sheet.
- **Browser on `pnpm dev`:** the values sheet on a phone-sized screen, with local invented data.
- **Revision:** branch `feat/month-values` on `main` at `664d01a`, changes uncommitted at the time.
- **Working tree:** the PR #10 changes only.
- **Result:** passed.
- **Not run:**
  - The walkthrough on the owner's phone.
  - The values with real data (H-4, after backups).
