# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- **The MVP build order is complete:** PRs #1 to #13 are merged, the last being backups.
- Deployed at https://money.david-krapka.eu. Production holds no financial data yet.
- **Backups:** the first production backup was taken on 2026-11-28 with `pnpm db:backup`; it passed the local restore check.
- **Restore drill, 2026-11-28 (owner):** the backup restored into Turso with every row, loaded through `turso db shell`. `turso db create --from-dump` had lost the user and passkey rows, so it is not used. **The risk trigger's "backups with a tested restore" is met.**
- In review (PR #14, branch `fix/restore-drill`): `pnpm db:restore-drill`, which repeats that drill and compares every table; the runbook's restore steps now use the shell route.

## Next step

**Owner:**
1. Keep taking weekly backups.
2. Do the walkthrough ([walkthrough.md](walkthrough.md)) on the phone and a computer.
3. Start H-1 (two weeks of daily logging) and H-4 (6 to 12 months of real investment values). Real entries can start now.

Then the owner picks new work from BACKLOG "Later".

## Blockers and open questions

- **Owner, still unconfirmed:**
  - `turso db shell moneyverse "PRAGMA foreign_keys"` prints `1`.
  - The `e2e` check is required in branch protection (optional).
- **On 2026-12-27:** check H-3's idle rule and read Vercel Hobby's limits.
- **Waiting for the owner or H-4:** O-14.
- **Open questions:** Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- **Commands:**
  - `pnpm verify` passed: format:check, lint, typecheck, 167 tests and the build.
  - `pnpm db:restore-drill` with a stand-in `turso` command over local SQLite files: a full restore passed and the temporary database was destroyed. A restore that dropped the user row was reported ("user: 1 in the backup, 0 restored", exit 1).
- **Owner, on production (2026-11-28):** `pnpm db:backup` passed; the manual shell-route drill restored user 1, passkey 1, exchange rates 12 and migrations 3.
- **Revision:** branch `fix/restore-drill` on `main` at `8a6d856`, changes uncommitted at the time.
- **Working tree:** the PR #14 changes only.
- **Result:** passed.
- **Not run:** `pnpm db:restore-drill` through the real Turso CLI (the owner's command).
