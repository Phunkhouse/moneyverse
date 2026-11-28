# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: setup and sign-in (PR #1), first deploy (PR #2), esbuild override (PR #3), app shell (PR #4), money rules and ČNB rates (PR #5), accounts and categories (PR #6).
- Deployed at https://money.david-krapka.eu (Vercel Hobby `fra1`, Turso free plan).
- In review (PR #7, branch `feat/quick-add`):
  - **Quick add** from the + button: keypad, Výdaj, Příjem or Převod, categories ranked by recent use, the last used account and today pre-filled, a new category created in place, and typing plus Enter on a computer.
  - **Toast with Zpět** after save, edit and delete.
  - **Transactions:** a list by day at `/transakce`, on each account's page, and the latest on Přehled; a tap edits or deletes.
  - **Kit part 3:** Chip, Keypad and Toast.
  - **Tests:** Playwright with axe (`pnpm e2e`, CI job `e2e`), covering the AC-1, AC-3 and AC-4 flows and axe on every screen, light and dark, at 375 and 1280 px.
  - **Contrast:** the tertiary ink and accent-on-soft colours were darkened or lightened for WCAG AA. Recorded as a proposal in `docs/design/README.md`.
- AC-1, AC-3 and AC-4 are covered end to end with invented data. They stay unticked until the owner's walkthrough on the phone.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #7 is merged:
- **H-1 can start:** two weeks of daily logging, measuring the median entry time and the days logged (SPEC). Real entries need a backup first.
- **Next build step:** monthly investment values (AC-6), BACKLOG "Next", first item.

## Blockers and open questions

- **Owner, before the first real money entry, and so before H-1:** backups with a tested restore (runbook "Backup and restore").
- **Owner:** confirm the contrast changes in `docs/design/README.md` (differences from the prototype).
- **Owner, optional:** require the new `e2e` check in branch protection next to `check`.
- **Unconfirmed from PR #5:** was `CRON_SECRET` set, and did `PRAGMA foreign_keys` print `1`?
- **On 2026-12-27:** check H-3's idle rule and read Vercel Hobby's limits.
- **Waiting for the owner or H-4:** O-14, investment balances ignore contributions until the next monthly value.
- **Open questions:** Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- **Commands:**
  - `pnpm verify` passed: format:check, lint, typecheck, 139 tests and the build.
  - `pnpm e2e` passed twice in a row (26 tests), against a production build with invented data.
- **Browser on `pnpm dev`:** quick add on a phone-sized screen; created a category in place, saved, saw the toast and the updated list.
- **Revision:** branch `feat/quick-add` on `main` at `75476a6`, changes uncommitted at the time.
- **Working tree:** the PR #7 changes only.
- **Result:** passed.
- **Not run:**
  - The CI `e2e` job (it runs on the PR).
  - Quick add on a real phone with a passkey.
  - Vercel rollback.
