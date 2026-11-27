# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-27 by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time in the order under "Planning and open questions".

## State

- Done and merged: project setup; database and invite-only passkey sign-in (PR #1); first deploy recorded (PR #2); esbuild override, Dependabot alert #1 fixed (PR #3).
- Deployed 2026-11-27 at https://money.david-krapka.eu (Vercel Hobby `fra1`, Turso free plan). The owner's passkey works on the Mac and the phone. The WebAuthn ceremony has no automated test.
- In review (PR #4, branch `feat/app-shell`): design tokens from the prototype, light, dark and "Podle systému" themes without a flash, Sora and Plus Jakarta Sans self-hosted, app shell (bottom bar on phones, sidebar from 760 px), the four tabs as empty screens, Plán as "coming later", the add button visible but inactive until quick add, restyled sign-in and invite pages, Czech catalogue and formatters with tests, kit part 1 and `/dev/kit` (404 in production), PWA manifest and PNG icons.
- The theme choice and sign-out sit in a temporary "Nastavení" card on Přehled until a settings screen exists (proposed for the backlog).
- H-3 partly checked: Turso's free limits recorded ([O-04](assumptions.md)); Vercel limits and idle behavior still open.
- Production holds no financial data yet, and there is no backup.

## Next step

After PR #4 is merged: money rules (balances, transfers, net worth, snapshots, currency conversion, ČNB rates), BACKLOG "Next", first item.

## Blockers and open questions

- Owner, before the first real money entry: backups with a tested restore (runbook "Backup and restore"). Turso's 1-day point-in-time restore is not enough on its own.
- Owner, if not done: branch protection on `main` requiring `check`.
- On 2026-12-27: check H-3's idle rule (nothing slept or was deleted) and read Vercel Hobby's limits.
- Open questions Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)).

## Last verified

- Command: `pnpm verify` (format:check, lint, typecheck, 53 tests, build); browser check on `pnpm dev`: sign-in page, Účty, Plán and Grafy at 375 px and 1280 px, light and dark, theme kept across reloads, `/dev/kit`, manifest and icons served without a session, an invalid session on Přehled redirected to sign-in; production build serves `/dev/kit` as 404
- Revision: branch `feat/app-shell` on `main` at `f280de4`, changes uncommitted at the time
- Working tree: the PR #4 changes only
- Result: passed
- Not run: Přehled signed in (needs a real passkey; owner check after deploy), installing to a phone home screen (AC-14 walkthrough, with the PWA checks PR), axe and Playwright (come with the transactions PR), an automated WebAuthn test, Vercel rollback
