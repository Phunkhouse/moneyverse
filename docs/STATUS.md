# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-26 17:00 CET by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3), one PR at a time. Current PR: database, invite-only passkey sign-in and the first deploy (AC-12, H-3), branch `feat/database-sign-in`.

## State

- `main` has the project setup (starter pack MVP profile, Standard CI, Claude PR review).
- On the branch: Drizzle on libSQL with the first migration (`drizzle/0000_auth.sql`, Better Auth's tables); Better Auth with passkeys only and invites from `pnpm invite:create` ([ADR 0004](decisions/0004-invite-only-passkey-sign-in.md)); `/prihlaseni`, `/pozvanka` and a signed-in placeholder home; a proxy redirect; rate limits; security headers; `vercel.json` (deploy only `main`); Vitest with 22 tests; the deploy steps in the [runbook](runbook.md).
- Checked locally in the browser: `/` redirects to sign-in; the invite page reads and clears the token; a bad invite is refused with a Czech message; security headers are present.
- Not deployed: the first deploy is owner steps (runbook "First deploy").

## Next step

Owner reviews and merges the PR, then runs the runbook's "First deploy" (Turso, migrate, Vercel, invite yourself). After that: design tokens, app shell and kit (BACKLOG "Next").

## Blockers and open questions

- Owner: branch protection on `main` with `check` required, now that CI has a run to name.
- Owner: the full passkey ceremony (create a passkey from an invite, sign out, sign in) is not verified by an agent; it needs a real authenticator. Try it locally or on the first deploy.
- Owner: choose the production subdomain before the first deploy (passkeys are bound to it).
- Open questions Q-1 and Q-3 to Q-10 ([SPEC](SPEC.md#planning-and-open-questions)); the Plán tab in the MVP ([design](design/README.md#open-design-questions)), needed before the app shell PR.

## Last verified

- Command: `pnpm verify` (format:check, lint, typecheck, test, build), `actionlint`, `check-links.py`; `pnpm db:migrate` and `pnpm invite:create` on a local file; browser checks on `pnpm dev`
- Revision: the PR's first commit (see the PR)
- Working tree: clean after commit
- Result: passed
- Not run: hosted CI (runs on the PR); the WebAuthn ceremony with a real passkey; anything against Vercel or Turso
