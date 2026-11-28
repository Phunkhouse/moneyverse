# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: PRs #1 to #7 (sign-in, app shell, money rules and ČNB rates, accounts and categories, quick add with Undo and the transaction list, Playwright and axe).
- Deployed at https://money.david-krapka.eu. On 2026-11-28 every app screen failed after PR #7 because the PR #5 and #6 migrations had gone to the local file. The owner migrated Turso: 3 migrations, `name_key` present, the site works again.
- In review (PR #8, branch `fix/hardening`):
  - `pnpm db:migrate:prod` refuses to run without the Turso URL and token in the terminal, and checks every table after migrating. `pnpm db:migrate` is local-only.
  - Czech error pages: inside the app shell, keeping the navigation; at the root; and `global-error`. Each shows the error code that matches the Vercel log.
  - The quick add loader fails softly, so the + button stays disabled and the page still loads.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #8 is merged: monthly investment values (AC-6), BACKLOG "Next", first item. The owner can run the AC-1, AC-3 and AC-4 walkthrough on the phone now.

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
  - `pnpm verify` passed: format:check, lint, typecheck, 141 tests and the build.
  - `pnpm e2e` passed: 26 tests.
  - Ran `pnpm db:migrate` locally: migrated, all 12 tables found.
  - Ran each refusal: a remote URL with `db:migrate`, and `db:migrate:prod` without the production variables.
- **Reproduction of the incident:** a production build against a local database with only the auth migration.
  - `/plan` and `/grafy` load, with quick add disabled.
  - `/ucty` and `/` show the Czech error inside the shell, with the navigation, and a code matching the server log.
- **Revision:** branch `fix/hardening` on `main` at `25c35ef`, changes uncommitted at the time.
- **Working tree:** the PR #8 changes only.
- **Result:** passed.
- **Not run:** `db:migrate:prod` against Turso (the owner's command; it should report 3 migrations and all tables present).
