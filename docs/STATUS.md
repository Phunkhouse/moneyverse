# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: PRs #1 to #9 (sign-in, app shell, money rules and ČNB rates, accounts and categories, quick add with Undo and the transaction list, Playwright and axe, guarded production migrations and Czech error pages).
- Deployed at https://money.david-krapka.eu. Production has all 3 migrations; `pnpm db:migrate:prod` gets the Turso URL and a one-day token from the logged-in CLI.
- Merged PR #10: monthly investment values with the reminder (last month, owner's decision) and history.
- In review (PR #11, branch `feat/dashboard-charts`): the dashboard and charts (AC-7, R-10 to R-12).
  - **Přehled:** a net worth hero with the change against last month and a 12-month area chart, and spending this month by category against a 6-month average.
  - **Grafy:** 6 or 12 months of net worth composition (cash, investments, a dashed total after debts, debts in the tooltip), spending by month against the average, this month against the average by category, a balance chart per account, and income against spending.
  - **Own SVG charts** (`src/ui/charts/`): exact values on hover, tap or arrow keys, a crosshair, and a hidden table for screen readers.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #11 is merged: export and re-import, and the PWA and phone checks (AC-13, AC-14), the last MVP item in BACKLOG "Next". H-4 (6 to 12 months of the owner's real values) can start once there is a backup.

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
  - `pnpm verify` passed: format:check, lint, typecheck, 150 tests and the build.
  - `pnpm e2e` passed: 33 tests, including AC-7 (the Přehled chart's exact value for this month equals the net worth figure, via keyboard), hover values by kind on Grafy, and axe on every screen with data.
- **Browser on `pnpm dev`:** Přehled and Grafy at 1280 and 375 px with local invented data; the tooltip checked on hover.
- **Revision:** branch `feat/dashboard-charts` on `main` at `35b905e`, changes uncommitted at the time.
- **Working tree:** the PR #11 changes only.
- **Result:** passed.
- **Not run:** the AC-7 walkthrough against hand-calculated totals with real data (owner, after backups).
