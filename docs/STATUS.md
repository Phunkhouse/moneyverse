# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: setup and sign-in (PR #1), first deploy (PR #2), esbuild override (PR #3), app shell, theme, kit part 1 and manifest (PR #4), money rules, ČNB rates and favicon (PR #5).
- Deployed at https://money.david-krapka.eu (Vercel Hobby `fra1`, Turso free plan).
- In review (PR #6, branch `feat/accounts-categories`):
  - Účty: net worth, assets and debts; accounts grouped as in the prototype; EUR and USD balances with the CZK value, estimated ones underlined; add, edit and archive in a sheet; an account page per account.
  - Kategorie (`/kategorie`, linked from the Nastavení card on Přehled): expense and income lists; add, rename and archive.
  - Kit part 2: Sheet (native `<dialog>`), Select, Row and RowList, Glyph and Money, all on `/dev/kit`; a Czech 404.
  - Amounts are typed in Czech form ("1 234,50") and parsed on the server. A credit card's opening debt is typed as a positive number and stored negative.
  - Fix: category names are now unique ignoring case for Czech letters too (migration `0002`); SQLite's `lower()` folds only ASCII.
- R-4 and R-7 have screens. AC-5 has its rule test and now a screen; the owner can tick it after a walkthrough.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #6 is merged: quick add and the transaction list with Playwright and axe (AC-1, AC-3, AC-4), BACKLOG "Next", first item. H-1 can start after it.

## Blockers and open questions

- Owner, for PR #6, before merging: run `pnpm db:migrate` against production (migration `0002_category_name_key`).
- Owner: was PR #5's `CRON_SECRET` set, and did `PRAGMA foreign_keys` print `1`? Not confirmed in this session.
- Owner, before the first real money entry: backups with a tested restore (runbook "Backup and restore").
- Owner, if not done: branch protection on `main` requiring `check`.
- On 2026-12-27: check H-3's idle rule and read Vercel Hobby's limits.
- O-14 (investment balances ignore contributions until the next monthly value) waits for the owner or H-4.
- Open questions Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- Command: `pnpm verify` (format:check, lint, typecheck, 133 tests, build), including the PR #6 review fixes; `pnpm db:generate` shows no drift.
- Browser on `pnpm dev`, with an invented local user and a session minted in the local database:
  - At 375 px: created an account and a credit card (stored as −9 500 Kč); edited with an invalid amount (error shown, typed values kept), then with a valid one (sheet closed, page refreshed).
  - At 1280 px: account groups, EUR and USD rows with the CZK value, a carried fund value, archiving.
  - Categories: created; "ÍDLO" refused next to "Jídlo"; archived.
  - An unknown account id shows the Czech 404 inside the shell.
- Revision: branch `feat/accounts-categories` at `9094a1f` plus the review fixes, uncommitted at the time.
- Working tree: the PR #6 changes only.
- Result: passed.
- Not run:
  - The review fixes in the browser (negative card debt, archive errors); they are covered by unit tests only.
  - axe and Playwright (planned for the next PR).
  - The screens while signed in with a real passkey.
  - The migration on Turso.
  - Vercel rollback.
