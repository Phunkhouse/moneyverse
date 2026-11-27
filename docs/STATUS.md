# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done: project setup; database and invite-only passkey sign-in (PR #1, merged). AC-12 is covered by tests for sign-up and sessions; the per-user data tests come with the first financial tables.
- Deployed 2026-11-27 at https://money.david-krapka.eu (Vercel Hobby `fra1`, Turso free plan), by the owner following the [runbook](runbook.md#first-deploy-done-2026-11-27). The owner's passkey was created on the Mac from an invite, and signing in worked on the Mac and on the phone. The WebAuthn ceremony is still not covered by an automated test.
- The Plán tab is shown as "coming later" in the MVP (owner, 2026-11-27, [design](design/README.md#decided)).
- H-3 partly checked: Turso's free limits recorded ([O-04](assumptions.md)); Vercel limits and idle behavior still open.
- Production holds no financial data yet, and there is no backup.
- Dependabot alert #1 (esbuild 0.18 under drizzle-kit, dev-only) is fixed by a scoped pnpm override to esbuild ^0.25.0 (PR #3); the alert should close once it merges.

## Next step

Design tokens, app shell, theme, logo and manifest, Czech catalogue and formatters, kit part 1 and `/dev/kit` (BACKLOG "Next", first item).

## Blockers and open questions

- Owner, before the first real money entry: backups with a tested restore (runbook "Backup and restore"). Turso's 1-day point-in-time restore is not enough on its own.
- Owner, if not done: branch protection on `main` requiring `check`.
- On 2026-12-27: check H-3's idle rule (nothing slept or was deleted) and read Vercel Hobby's limits.
- Open questions Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- Command: `pnpm db:generate` (no changes), `pnpm db:migrate` on the local file, `pnpm verify` (format:check, lint, typecheck, 32 tests, build)
- Revision: branch `fix/esbuild-override` on `main` at `2af869f`, with the override in `pnpm-workspace.yaml` and `pnpm-lock.yaml` uncommitted at the time
- Working tree: only those two files and this one changed
- Result: passed. Production checked by the owner on 2026-11-27 (sign-in on Mac and phone).
- Not run: an automated test of the WebAuthn ceremony; Vercel rollback; hosted CI on this branch (runs on the PR)
