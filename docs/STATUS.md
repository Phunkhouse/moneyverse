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
- Merged or in review: PR #14 (`pnpm db:restore-drill`, restore through the Turso shell).
- In review (PR #15, branch `feat/cloud-backup`, [ADR 0006](decisions/0006-cloud-backups.md)): a Cloudflare Worker backs up production daily to R2, encrypted with the owner's public key, kept 30 days; `pnpm backup:keygen` and `pnpm backup:decrypt`. Needs the owner's one-time setup (runbook "Cloud backups").

## Next step

**Owner:**
1. After PR #15 is merged: the one-time cloud backup setup (runbook "Cloud backups"), then check the first daily file with `pnpm backup:decrypt`. Until then, weekly `pnpm db:backup`.
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
  - `pnpm verify` passed: format:check, lint, typecheck, 171 tests and the build, including the Worker's tests (`workers/backup`) and the envelope tests.
  - A real SQLite dump of the local development database (invented data) was encrypted the way the Worker does and opened with `pnpm backup:decrypt`: no session rows, restore check passed, file mode 600.
  - CPU per run measured in Node: 0.35 ms for 50 kB and 1.24 ms for 2 MB (Workers Free allows 10 ms).
- **Revision:** branch `feat/cloud-backup` on top of `fix/restore-drill` (`cdeecde`), changes uncommitted at the time.
- **Working tree:** the PR #15 changes only.
- **Result:** passed.
- **Not run:**
  - A deploy to Cloudflare.
  - A real cron run.
  - `GET /dump` against Turso with a read-only token (documented, not verified).
  - The owner's setup.
