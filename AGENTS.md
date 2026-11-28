<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project instructions

## Governance

- Profile: `MVP`, from starter pack `69ea64b`, with recipes `next-fullstack`, `ci-strategy` (Standard), `claude-pr-review` and `discovery`. The profile section below sets how much process this project uses.
- Risk triggers that apply: stores personal data, handles money, has sign-in, is publicly reachable (the app runs on a subdomain behind a login), and has real users from the owner's first real entry (backups with a tested restore must exist before that). Overrides: none.
- Only the owner changes the profile or an override.

## Sources of truth

- `README.md`: what the project is and how to run it. `docs/SPEC.md`: requirements, scope, facts and open questions. `docs/STATUS.md`: current state and next step. The profile section lists any further documents.
- Mark every fact with its status: **confirmed** (by whom, date), **assumption**, **proposal** or **decided** (with a link to the decision). Never present an assumption or proposal as confirmed.
- When the code, the docs and your assumptions disagree, the code is the truth for current behavior and the docs for intended behavior. Report the disagreement and ask; do not silently pick one or change the other to match.
- Before changing code, inspect the relevant files and the installed framework's documentation. Do not assume that remembered APIs match this project.

## Scope and evidence

- Work only within the agreed scope. Material product, scope or architecture changes need the owner's word.
- Propose work found outside the scope in your final message; do not do it.
- Report work with evidence: the checks actually run, on which revision, and what could not be run. Written but unverified is not done.

## Handover

- **Resume:** at the start of every session and after a context reset, read `docs/STATUS.md`, then the acceptance criteria and decisions in `docs/SPEC.md` that it names. Compare the current revision and working tree (`git diff --stat <verified revision>`, `git status --short`) with the state its last verification covered. If anything other than `docs/STATUS.md` changed, that verification is stale: say so and run the checks again before reporting anything as done. Uncommitted changes that `STATUS.md` does not describe are a disagreement: ask before building on them.
- **Update** `docs/STATUS.md` at every handoff and whenever the state changes materially: a step finished, scope changed, a blocker appeared. Rewrite it, do not append: goal, current state, next step, blockers, and the last verification with its revision and working-tree state. Keep it under one page; history lives in Git.

## Commands

- Use the package manager and scripts selected for this project. Check the manifest before running a command.
- Before finishing a code change, run the relevant checks. Record their results and any checks you could not run.
- When adding or changing a script, update this section with its exact command and purpose.

Node 26 (`.nvmrc`, `engines`) and pnpm (pinned in `packageManager`); run `nvm use` first.

- `pnpm install --frozen-lockfile`: install exactly what the lockfile says.
- `pnpm dev`: development server. `pnpm build`: production build. `pnpm start`: serve the build.
- `pnpm format:check` (Prettier check; `pnpm format` writes), `pnpm lint` (ESLint, including the `src/server/` import boundary), `pnpm typecheck` (`next typegen && tsc --noEmit`).
- `pnpm test`: Vitest. Database tests run on a fresh, migrated libSQL file each, so they need no services.
- `pnpm verify`: runs `format:check`, `lint`, `typecheck`, `test` and `build` in order and changes no files.
- `pnpm e2e`: Playwright with axe (`e2e/`) against a production build on port 3100 and the separate database `.data/e2e.db`, with an invented user and session from `e2e/global-setup.ts`. Needs Chromium once: `pnpm exec playwright install chromium`. CI runs it in the `e2e` job.
- `pnpm db:generate`: writes a migration in `drizzle/` after a schema change (`src/server/db/schema.ts`). Never `drizzle-kit push` on real data.
- `pnpm db:migrate`: applies the migrations to the local file (`DATABASE_URL`, default `file:.data/dev.db`; a remote URL is refused) and checks the tables.
- `pnpm db:migrate:prod`: applies them to Turso and checks every table exists. Uses `DATABASE_URL` and `DATABASE_AUTH_TOKEN` if both are set in the terminal; otherwise asks the logged-in Turso CLI for the URL and a token valid for one day. Owner only.
- `pnpm invite:create --email <email> --name <name>` (or `--existing`): creates a single-use invite and prints its link once (`.env.local` or the shell's environment).
- `pnpm icons:render`: re-renders the app icons (`public/icons/`, `src/app/apple-icon.png`, `src/app/favicon.ico`) from the brand mark (`scripts/render-icons.ts`); run after a logo change and commit them.
- `pnpm rates:backfill --year <YYYY>`: loads whole years of ČNB rates into `DATABASE_URL` (repeatable).
- **Production is owner-run only.** Never run `db:migrate:prod`, `invite:create` or `rates:backfill` against production, and never ask for, read or print production values; give the owner the command from `docs/runbook.md` instead.

Code layout: `src/ui/` holds the design tokens' Sass helpers, the kit (`src/ui/kit/`, shown at `/dev/kit` in development), the Czech catalogue (`messages.ts`) and formatters (`format.ts`); global tokens are in `src/app/globals.scss`. `src/server/` is framework-free (database, auth, the money rules in `src/server/money/`) with relative `.ts` imports, so Node runs the scripts in `scripts/` directly; the app reaches it through `src/app/_lib/`. Every page and server action that touches a user's data calls `requireUser()` first and scopes queries by that user's id.

## Changes

- Keep diffs focused.
- Name commits `type: short imperative summary`, using lowercase `feat`, `fix`, `docs`, `refactor`, `test` or `chore` as appropriate.
- Before finishing, run the relevant checks, update affected documentation and commands, and mention unrelated changes without folding them into the task.
- Keep this file short. Put long procedures in `docs/DEVELOPMENT.md` and link them from here.
- Do not commit secrets, `.env` files or personal data. If the project needs environment variables, create `.env.example` with names and safe examples only.

## Public repository

The repository is public (owner's choice, 2026-11-26). Everything committed, every CI log and every Actions artifact can be read by anyone.

- Only invented data in seeds, fixtures, tests, screenshots and Playwright reports. Never the owner's real transactions, balances or account names, not even to reproduce a bug: describe its shape and add an invented example.
- Never put database dumps, exports or backups in Actions artifacts, caches or logs.
- Keep GitHub secret scanning with push protection and Dependabot alerts on.

## Product and UI rules

- The interface is Czech only (R-25). Money and dates go through the shared formatters (`cs-CZ`), never hand-built strings.
- Money is stored as integer minor units with the account's currency; never floats. Totals and conversions are computed on the server.
- The prototype in `docs/design/prototype/` is the design source of truth (see `docs/design/README.md`). Custom components with SCSS Modules in a small kit like Systerna's; no Tailwind, shadcn or headless component library without a decision record ([ADR 0002](docs/decisions/0002-custom-ui-kit.md)).
- Do not use `use cache`, `cacheLife` or `cacheTag` on anything that depends on a session or a user's financial data.

## Risk triggers

These apply whatever the profile. Record the ones that apply under Governance.

| When the project      | It needs                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Stores personal data  | Only the data it needs, access checks on the server, no personal data in logs, seeds or tests.            |
| Handles money         | Amounts computed on the server, idempotent operations, tests for rounding and failures.                   |
| Has sign-in           | Authorization checked on the server for every route, and tests that one user cannot reach another's data. |
| Has real users        | Backups with a tested restore, error monitoring and a rollback path.                                      |
| Is publicly reachable | Dependency and secret scanning, rate limits on endpoints open to abuse, security headers.                 |

## Git remote

- Remote (ai-starter-pack, 2026-11-26): `origin` is `git@github-personal:Phunkhouse/moneyverse.git`, a public repository. Fetch and push only over SSH through the `github-personal` host alias, and use the same alias for any clone or added remote.
- If SSH fails (for example `Permission denied (publickey)`), stop and report it. Do not switch to HTTPS, a token or another account to get around it.

## MVP profile

- **Further sources of truth:** assumptions and hypotheses in `docs/assumptions.md`; decisions that constrain future work in `docs/decisions/`; approved design, when there is a UI, in `docs/design/`; deployment and operations in `docs/runbook.md`; the backlog in `docs/BACKLOG.md`, its only home.
- **Hypotheses:** every open assumption in the register says how it gets confirmed: by whom or by what evidence. Build on it as written. When it is confirmed or disproved, update the register and the rules and tests that depend on it in the same change.
- **Scope:** the owner prioritizes the backlog and decides what comes next. Work found along the way is proposed for the backlog, not built.
- **Decisions:** write a decision record when a choice constrains future work or is costly to reverse, such as the data model, platform, sign-in or an external service. Explain other meaningful choices in the PR description.
- **Architecture:** keep business rules separate from route handlers and UI components, with validation and trust-boundary checks on the server, so the product can mature without a rewrite. Do not add layers, services or infrastructure for scale the product has not reached.
- **Tests:** test by risk: business rules, trust boundaries and data integrity at the lowest useful level, real database integration tests for transactions, and a few end-to-end tests for the flows users depend on. Never add placeholder tests.
- **Checks and CI:** `pnpm verify` runs `format:check`, `lint`, `typecheck` and `build` locally and changes no files; once tests exist, it includes them. CI strategy: `Standard`, from the starter pack's CI strategy recipe: `.github/workflows/ci.yml` runs the `check` job on every PR event, drafts included. Independent CI on the current revision must pass before merge.
- **Pull requests:** one focused PR at a time, reviewed by the owner. Merge: the owner merges. When a PR needs owner actions, such as a migration, a secret or a step on another machine, put them in an `> [!IMPORTANT]` block at the top of the description and repeat them in chat. The owner can ask for a Claude review by commenting `@claude review` on the PR (`.github/workflows/claude.yml`); it is a comment, not an approval.
- **Deploy:** repeatable and written down in `docs/runbook.md`: how to deploy and roll back, and, once there is real data, how to back up and restore.
- **Toward Production:** when paying users, personal data at scale, a second regular contributor or availability commitments arrive, tell the owner. A readiness review decides whether the project moves to Production.

## Discovery handover

- `docs/discovery/money-tracker/handover.md` is where this project's goal, scope, acceptance criteria, assumptions and decisions came from; `brief.md` beside it records why. `docs/SPEC.md` is the source of truth for what is built.
- Keep discovery IDs (`AC-`, `A-`, `D-`) in SPEC entries. Assumptions from the handover stay `assumption` until the owner confirms the fact or a reliable source verifies it.
- Handover non-goals and deferred work stay out of scope unless the owner moves them in.
- If implementation shows a discovery assumption is wrong or a criterion cannot be met, stop and tell the owner. Changes to the problem, scope or criteria go back through discovery (the brief, then a regenerated handover), then the SPEC. Never edit `handover.md` by hand.
