# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- **The MVP build order is complete:** PRs #1 to #12 are merged, the last being export and re-import (AC-13).
- Deployed at https://money.david-krapka.eu. Production holds no financial data yet.
- In review (PR #13, branch `feat/backup-restore`):
  - `pnpm db:backup`: dumps production through the Turso CLI to a dated file outside the repository, without sessions, challenges or rate limits, and restore-checks it.
  - `pnpm db:restore-check`.
  - The runbook's backup, restore and drill steps.
- Acceptance criteria ticked: AC-2, AC-5, AC-8, AC-9, AC-13. The rest need the owner's walkthrough ([walkthrough.md](walkthrough.md)), except AC-12 and AC-15, which have tests but are not ticked (see SPEC).

## Next step

**Owner**, in order:
1. After PR #13 is merged: run `pnpm db:backup`, do the restore drill (runbook "Backup and restore"), and set the weekly backup habit.
2. The walkthrough on the phone and a computer.
3. Start H-1 (two weeks of daily logging) and H-4 (6 to 12 months of real investment values).

Then the owner picks new work from BACKLOG "Later".

## Blockers and open questions

- **Owner:** the backup and restore drill before the first real entry; it is not done until the drill is recorded in the runbook.
- **Owner, still unconfirmed:**
  - `turso db shell moneyverse "PRAGMA foreign_keys"` prints `1`.
  - `CRON_SECRET` is set in Vercel.
  - The `e2e` check is required in branch protection (optional).
- **On 2026-12-27:** check H-3's idle rule and read Vercel Hobby's limits.
- **Waiting for the owner or H-4:** O-14.
- **Open questions:** Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- **Commands:**
  - `pnpm verify` passed: format:check, lint, typecheck, 166 tests and the build.
  - `pnpm db:restore-check` on a real SQLite `.dump` of the local development database (invented data) passed: 3 migrations, all 12 tables present.
  - `pnpm db:backup` passed with a stand-in `turso` command that printed that local dump: the file was saved with mode 600, had no session rows, and passed the restore check.
  - The backup refuses a folder inside the repository.
- **Revision:** branch `feat/backup-restore` on `main` at `82737ae`, changes uncommitted at the time.
- **Working tree:** the PR #13 changes only.
- **Result:** passed.
- **Not run:**
  - `pnpm db:backup` against production through the real Turso CLI (the owner's command).
  - The restore into Turso (the drill).
