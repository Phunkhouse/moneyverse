# Project specification

Moneyverse is a personal money tracker. This file is the source of truth for what is built. It was filled on 2026-11-26 from the [discovery handover](discovery/money-tracker/handover.md); the [brief](discovery/money-tracker/brief.md) records why. IDs (`R-`, `AC-`, `A-`, `D-`, `Q-`, `H-`, `RK-`) are the discovery's and are kept so every line can be traced.

Status words: **confirmed** (by whom, date), **decided** (link), **assumption**, **proposal**.

## Purpose and users

- **Problem (decided, D-1):** the owner tracks every transaction by hand and investment values monthly, but entries, investment values and charts are spread across a tracker and manual bookkeeping, so the effort gives no feedback on where money goes or how net worth develops.
- **Outcome:** logging a transaction takes a few seconds, and every account, including investments, feeds one set of charts and budgets the owner checks regularly.
- **Users:** the owner (P-1), the only user now. Friends (P-2) may join later with their own ledgers (R-20, could). No money is earned.
- **Direction (decided, D-2, D-5):** build the smallest slice of a custom PWA. Trying existing open-source trackers first (H-2) was waived by the owner; A-10 is accepted, unverified.

## Scope

**Current release: MVP (decided, D-3).** Every must-have below is approved.

| ID | Requirement |
| --- | --- |
| R-1 | Log an expense or income with amount, category, account, date, optional what and note, with account and date pre-filled |
| R-2 | Record transfers between own accounts, including paying off a credit card, without counting them as spending |
| R-3 | Edit, delete and immediately undo a transaction |
| R-4 | Manage own categories |
| R-7 | Accounts of type checking, credit card, savings, brokerage, crypto, managed fund and retirement |
| R-8 | A monthly value per investment account, with its history |
| R-10 | Net worth over time, and its composition by kind of account |
| R-11 | Balance over time per account |
| R-12 | Spending by category compared between months |
| R-17 | Login required; nobody can sign up without an invite |
| R-18 | Export all data as a file at any time |
| R-23 | Each account holds CZK, EUR or USD; totals, budgets and charts convert to CZK by default and can be shown in EUR or USD |
| R-24 | Installable on a phone home screen; layout for phone and desktop |
| R-25 | Czech interface, with Czech number, date and currency formats |

**Next, in the backlog (proposal, owner orders them):** budgets (R-14), recurring calendar and confirm (R-15, R-16), history import (R-19), trends (R-13), search (R-6), offline entry (R-5), snapshot reminder (R-9), several users (R-20), self-hosting (R-21). See [BACKLOG.md](BACKLOG.md).

**Out of scope (non-goals):** bank connections (R-22); trading, prices or holdings per security (A-4); public sign-up (C-5); native apps (C-3).

## Important workflows and requirements

### W-4 Log a transaction

The owner opens the app from the home screen, types the amount on a keypad that is ready immediately, taps a category (most used and recent first) and saves; the last used account and today's date are already filled in. What and note are optional. A wrong entry is undone from the confirmation, or edited or deleted later; a missing category is created in place.

- [ ] **AC-1** From the home screen, an expense with amount and category is saved in 3 taps after typing the amount, with today's date and the last used account filled in; walkthrough (R-1)
- [ ] **AC-2** A credit card payment moves money from checking to the card, changes both balances, and does not appear in spending totals; test (R-2)
- [ ] **AC-3** Right after saving, Undo removes the entry; later, editing or deleting it updates balances and charts; walkthrough (R-3)
- [ ] **AC-4** A missing category can be created during entry without leaving it; walkthrough (R-4)

### W-5 Monthly snapshot

When the month turns, the app shows that values are due. One screen lists every investment account with last month's value; the owner types the new values and net worth updates. A skipped month carries the last value forward, marked as carried.

- [ ] **AC-5** All seven account types can be created, and each appears in net worth with the right sign (debt negative); test (R-7)
- [ ] **AC-6** All investment values for a month are entered on one screen; a skipped month carries the last value forward and is marked as carried; walkthrough (R-8)

### W-6 Review

The dashboard shows net worth and its trend and this month's spending; from there the owner drills into composition, balance over time and category comparisons. With little history, charts say how many months they cover.

- [ ] **AC-7** Net worth shows per month for the last 12 months, split by kind of account, with exact values on hover or tap; walkthrough against hand-calculated totals (R-10)
- [ ] **AC-8** Each account shows its month-end balance over time; test (R-11)
- [ ] **AC-9** Spending per category this month is shown next to the average of the previous months; transfers are excluded; test (R-12)

### All screens

- [ ] **AC-12** Without logging in, no page or data endpoint returns financial data, and sign-up without an invite fails; test (R-17)
- [ ] **AC-13** One action downloads all accounts, transactions, snapshots and budgets in a file that can be imported again; test (R-18)
- [ ] **AC-14** The app installs to a phone home screen and is usable at 375 px and 1280 px wide; walkthrough (R-24)
- [ ] **AC-15** An expense on a EUR account keeps its EUR amount, counts in CZK totals and budgets at that day's rate, and a CZK to EUR transfer records both amounts; if no rate is available, the last known rate is used and marked; test (R-23)
- [ ] **AC-16** Every screen is in Czech, with amounts like 1 234,50 Kč and dates like 26. 11. 2026; walkthrough (R-25)

AC-10 (budget overspending, R-14) and AC-11 (recurring payments, R-15, R-16) belong to the backlog items and apply when those are built.

## Data and trust boundaries

- **Stored:** the owner's accounts, categories, transactions, monthly investment values, exchange rates and sign-in data. No bank credentials, ever (RK-1). Personal financial data: every query is scoped to the signed-in user on the server, and an owner id is on every record (A-9).
- **Money:** amounts are integer minor units in the account's own currency; totals, conversions and net worth are computed on the server ([ADR 0003](decisions/0003-money-and-currencies.md)). Saving a transaction is idempotent, so a double tap cannot create two.
- **External input:** daily ČNB exchange rates (proposal: fetched by a daily cron, parsed and validated on the server). Form input is validated on the server.
- **Public repository:** only invented data in seeds, fixtures, tests and CI output (see `AGENTS.md`).

## Technical approach

| Area | Choice | Status |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, `src/`, TypeScript), Node 26, pnpm | decided, [ADR 0001](decisions/0001-application-stack.md) |
| Database | Turso (libSQL) with Drizzle ORM; a local libSQL file for development and tests | decided, D-4, [ADR 0001](decisions/0001-application-stack.md) |
| Hosting | Vercel Hobby on a subdomain; production deploys only from `main` | proposal, checked by H-3 in the first feature PR |
| Sign-in | Better Auth with passkeys, invite-only | proposal, its own decision record in the first feature PR |
| UI | Own component kit with SCSS Modules; own SVG charts | decided, [ADR 0002](decisions/0002-custom-ui-kit.md) |
| Language | Czech only: a typed message catalogue plus `Intl` formatters for `cs-CZ`; no i18n library yet | decided by the owner, 2026-11-26 |
| PWA | Web manifest and icons only; a service worker waits for offline entry (R-5) | decided by the owner, 2026-11-26 |
| Exchange rates | ČNB daily rates, stored per day | proposal (tech plan) |
| Tests | Vitest for rules and components, libSQL integration tests, Playwright with axe from the quick-add flow on | proposal, added with the first behavior |
| Checks | `pnpm verify` locally; the `check` job in CI on every PR | decided, see `AGENTS.md` |

The starter pack revision, profile and recipes are recorded in the Governance section of `AGENTS.md`.

## Known limitations and risks

- **RK-3 (main risk):** entry is too slow to keep logging. H-1 tests it: two weeks of daily use after the quick-add PR, median 6 seconds or less and logging on 12 of 14 days (proposed targets).
- **RK-1, RK-2, RK-5:** financial data on third-party free tiers that can change terms (Turso says it is joining Supabase). Mitigations: login from day one, no open sign-up, full export (R-18), a scheduled backup with a tested restore before real data, and SQLite-compatible storage.
- **RK-4:** scope creep before the core loop works. New items go to the backlog as proposals.
- The repository is public, so backups and exports must never pass through GitHub Actions artifacts.

## Planning and open questions

**Build order (proposal, approved as a plan by the owner 2026-11-26; one PR at a time):**

1. Database, sign-in and first deploy (H-3). Seed data recipe offered with the first migration. AC-12.
2. Design tokens, app shell, theme, logo and manifest, Czech catalogue and formatters, kit part 1, `/dev/kit`. AC-14 layout, AC-16.
3. Money rules in `src/server/`: balances, transfers, net worth, carried snapshots, conversion; ČNB rates. AC-2, AC-5, AC-8, AC-9, AC-15.
4. Accounts and categories. R-4, R-7.
5. Quick add and the transaction list, with Playwright and axe. AC-1, AC-3, AC-4. H-1 can start after this.
6. Monthly investment values. AC-6.
7. Dashboard and charts. AC-7, R-10 to R-12.
8. Export and re-import; PWA and phone checks. AC-13, AC-14.

**Open questions for the owner (none blocks the start):** Q-9 (what frustrates you about the current tracker), Q-1 (which tracker, can it export), Q-3 (monthly values enough for investments), Q-4 (budgets: limits or envelopes), Q-5 (recurring: automatic or on tap), Q-6 (credit card payoff as a transfer), Q-7 (logging without signal), Q-8 (transactions a month), Q-10 (shared accounts with friends). Working assumptions are in [assumptions.md](assumptions.md).

**Declined or omitted offers (2026-11-26, owner approved the defaults):**

- Legal planning: omitted for now; offer again before friends join (R-20).
- Scalability and cost planning: omitted; volumes are tiny (about 1,500 rows a year, an estimate) and H-3 checks the free tiers.
- Claude PR review: adopted (`@claude review`).

## Design

The [design source of truth](design/README.md) is the clickable prototype and its design system page. The app follows its layout, tokens and components, rebuilt as SCSS Modules.
