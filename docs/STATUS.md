# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: PRs #1 to #7 (sign-in, app shell, money rules and ČNB rates, accounts and categories, quick add with Undo and the transaction list, Playwright and axe).
- Deployed at https://money.david-krapka.eu. On 2026-11-28 every app screen failed after PR #7 because the PR #5 and #6 migrations had gone to the local file. The owner migrated Turso: 3 migrations, `name_key` present, the site works again.
- Merged PR #8: `pnpm db:migrate:prod` with table checks, Czech error pages, and a soft-failing quick add loader.
- In review (PR #9, branch `fix/migrate-prod-credentials`): `pnpm db:migrate:prod` asks the logged-in Turso CLI for the URL and a one-day token when the terminal has neither, so a new terminal needs no exports for migrations. Variables already set in the terminal still win; setting only one of them is refused.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #9 is merged: monthly investment values (AC-6), BACKLOG "Next", first item. The owner can run the AC-1, AC-3 and AC-4 walkthrough on the phone now.

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

- Command: `pnpm verify` (format:check, lint, typecheck, 144 tests, build) after the PR #9 change; the production migrate path with no Turso CLI available refuses with the `turso auth login` hint.
- Revision: branch `fix/migrate-prod-credentials` on `main` at `55ccbc6`, changes uncommitted at the time
- Working tree: the PR #9 changes only
- Result: passed
- Not run: `pnpm db:migrate:prod` through the real Turso CLI (it creates a production token; the owner's command). Expected: "Using the Turso CLI login…", then 3 migrations and all tables present.
