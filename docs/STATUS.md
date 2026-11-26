# Status

Rewritten, not appended, at every handoff and whenever the state changes materially. Under one page; history lives in Git.

Updated: 2026-11-26 16:30 CET by Claude Code

## Goal

Build the MVP in [SPEC.md](SPEC.md) (D-3, AC-1 to AC-9 and AC-12 to AC-16), one PR at a time in the order under "Planning and open questions".

## State

- Discovery handed over 2026-11-26 (D-1 to D-3 approved, H-2 waived by D-5). SPEC, assumptions, backlog, runbook, design source of truth and ADRs 0001 to 0003 filled from the handover.
- Setup committed on `main`: Next.js 16.4.6 scaffold with a placeholder Czech page, Prettier, ESLint, `pnpm verify`, Standard CI (`.github/workflows/ci.yml`, job `check`) and Claude PR review (`.github/workflows/claude.yml`). No tests yet: there is no behavior to test.
- Repository `Phunkhouse/moneyverse` created as public on GitHub; `origin` is set over SSH.
- No feature work started.

## Next step

First feature PR: database, sign-in and first deploy (BACKLOG "Next", item 1): Drizzle on libSQL, migrations, invite-only passkey sign-in with its decision record, user scoping tests (AC-12), Vercel and Turso deploy as the H-3 check, runbook. Offer the seed data recipe with the first migration.

## Blockers and open questions

Owner actions:

1. Turn on branch protection for `main` with `check` as a required status check, once CI has run on the first PR (so GitHub knows the check name).
2. Turn on secret scanning with push protection and Dependabot alerts (Settings → Advanced Security).
3. For `@claude review`: install the Claude GitHub App on the repository, and add the Actions secret `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`).
4. Before the first feature PR's deploy step: a Vercel account linked to the repository and a Turso database. The PR will list the exact steps.

Open for the owner (none blocks the start): Q-1, Q-3 to Q-10 in [SPEC.md](SPEC.md#planning-and-open-questions); whether the Plán tab is hidden or shown as "coming later" in the MVP ([design open question](design/README.md#open-design-questions)).

## Last verified

- Command: `pnpm verify` (format:check, lint, typecheck, build), `actionlint` on both workflows, the starter pack's `check-links.py`, a scan of staged files for sensitive patterns
- Revision: `77f9004` (the setup commit; verified as `acf4786`, same tree, author email changed to the GitHub noreply address)
- Working tree: clean
- Result: passed
- Not run: hosted CI (no PR yet; `ci.yml` triggers on pull requests only). Tests: none exist.
