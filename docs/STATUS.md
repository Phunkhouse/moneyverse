# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: PRs #1 to #11 (sign-in, app shell, money rules and ČNB rates, accounts and categories, quick add with Undo and the transaction list, guarded production migrations, monthly investment values, the dashboard and charts).
- Deployed at https://money.david-krapka.eu.
- In review (PR #12, branch `feat/export-import`): export and re-import (R-18, AC-13).
  - **Export:** Přehled → Nastavení → Data downloads a versioned JSON file of the user's ledger (`/api/export`, which checks the session itself).
  - **Import:** reads such a file into an empty ledger, all or nothing, with fresh ids and the ledger rules.
  - **Walkthrough checklist** for the owner in `docs/walkthrough.md`.
  - **Acceptance criteria:** AC-2, AC-5, AC-8, AC-9 and AC-13 are ticked in SPEC.md, on their tests.
- **The MVP build order is complete with this PR.** What remains:
  - The owner's walkthrough: AC-1, AC-3, AC-4, AC-6, AC-7, AC-14, AC-16.
  - AC-12 and AC-15. They have tests, but their wording includes parts not built or not checked end to end: budgets (R-14), and every data endpoint without login.
  - Backups before real data.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #12 is merged:
- **Owner:** backups with a tested restore, then the walkthrough ([walkthrough.md](walkthrough.md)), then H-1 (two weeks of daily use) and H-4 (6 to 12 months of real investment values).
- **New work:** the owner picks the next items from BACKLOG "Later".

## Blockers and open questions

- **Owner, before the first real money entry, and so before H-1:** backups with a tested restore (runbook "Backup and restore").
- **Owner, still unconfirmed:**
  - `turso db shell moneyverse "PRAGMA foreign_keys"` prints `1`.
  - `CRON_SECRET` is set in Vercel.
  - The `e2e` check is required in branch protection (optional).
- **On 2026-12-27:** check H-3's idle rule and read Vercel Hobby's limits.
- **Waiting for the owner or H-4:** O-14.
- **Open questions:** Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- **Commands:**
  - `pnpm verify` passed: format:check, lint, typecheck, 157 tests and the build.
  - `pnpm e2e` passed: 39 tests, including AC-13 (download, import into a second empty invented user, refusal when not empty, refusal of a foreign file, 401 for a forged session) and axe on `/data`.
- **Revision:** branch `feat/export-import` on `main` at `dc93193`, changes uncommitted at the time.
- **Working tree:** the PR #12 changes only.
- **Result:** passed.
- **Not run:**
  - The owner's walkthrough.
  - An import with real data.
