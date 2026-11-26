# Handover: Personal money tracker

- **Source:** `brief.md`, Updated 2026-11-26. This file is a snapshot of the approved parts of that brief. If the brief's `Updated` is later, this handover is stale: ask for it to be regenerated before relying on it.
- **Approved by:** Owner and primary user (P-1), 2026-11-26 (D-1, D-2, D-3, D-5)
- **Direction:** Build the smallest slice of the custom PWA (O-4): fast entry, all accounts, monthly snapshots, core charts, single user. Budgets and recurring payments come next. H-2 (trying existing trackers first) is waived (D-5).

## Problem and outcome

A developer who tracks every transaction by hand, and investment values monthly, struggles to see where money goes and how net worth develops when entries, investment values and charts are spread across a tracker and manual monthly bookkeeping. It is solved when logging a transaction takes a few seconds and every account, including investments, feeds one set of charts and budgets the owner checks regularly. The owner (P-1) is the only user now; friends (P-2) may join later. No money is earned; the value is the owner's time and financial insight.

## Scope

**Must have**

- Fast entry with transfers, edit and undo, own categories (R-1 to R-4)
- All account types and monthly snapshots (R-7, R-8)
- Net worth, balance and category charts (R-10 to R-12)
- Private login, export, installable responsive app (R-17, R-18, R-24)
- CZK, EUR and USD accounts with conversion (R-23)
- Czech interface (R-25)

**Optional** (proposed, not approved; the owner orders them)

- Budgets (R-14), recurring calendar and confirm (R-15, R-16), history import (R-19), trends (R-13), search (R-6), offline entry (R-5), reminder (R-9), then several users (R-20), self-hosting (R-21)

**Non-goals**

- Bank connections (R-22)
- Trading, prices or holdings per security (A-4)
- Public sign-up (C-5)
- Native apps (C-3)

**Deferred**

- None yet.

## User workflows

- **W-4 Log a transaction** P-1: makes a purchase or receives money → opens the app from the home screen → types the amount on a keypad that is ready immediately → taps a category (recent first) → account and date are already filled with the last used account and today → optionally adds what and a note → saves. Failure cases: wrong entry → undo from the confirmation, or edit and delete later; category missing → create it in place; no connection → see A-6.
- **W-5 Monthly snapshot** P-1: the month turns and the app shows that values are due → one screen lists every investment account with last month's value → types new values → net worth updates. Failure cases: a skipped month → the last value carries forward and is marked as carried; a value in another currency → converted (R-23).
- **W-6 Review and plan** P-1: opens the dashboard → sees net worth and its trend, this month's spending against budgets, and upcoming payments → drills into composition, balance over time, category comparisons and trends. Failure cases: little history → charts say how many months they cover; a budget overspent → shown in a distinct state with the amount over.
- **W-7 Recurring payments** (optional scope, R-15, R-16) P-1: sets up rent, subscriptions, salary with a cadence → the calendar shows what is due → on the due date confirms with one tap, adjusting the amount if it changed. Failure cases: a payment not confirmed stays flagged as due, never silently posted (A-7).

## Acceptance criteria

**W-4 Log a transaction**
- [ ] **AC-1** From the home screen, an expense with amount and category is saved in 3 taps after typing the amount, with today's date and the last used account filled in; checked by walkthrough (R-1)
- [ ] **AC-2** A credit card payment moves money from checking to the card, changes both balances, and does not appear in spending totals; checked by test (R-2)
- [ ] **AC-3** Right after saving, Undo removes the entry; later, editing or deleting it updates balances and charts; checked by walkthrough (R-3)
- [ ] **AC-4** A missing category can be created during entry without leaving it; checked by walkthrough (R-4)

**W-5 Monthly snapshot**
- [ ] **AC-5** All seven account types can be created, and each appears in net worth with the right sign (debt negative); checked by test (R-7)
- [ ] **AC-6** All investment values for a month are entered on one screen; a skipped month carries the last value forward and is marked as carried; checked by walkthrough (R-8)

**W-6 Review**
- [ ] **AC-7** Net worth shows per month for the last 12 months, split by kind of account, with exact values on hover or tap; checked by walkthrough against hand-calculated totals (R-10)
- [ ] **AC-8** Each account shows its month-end balance over time; checked by test (R-11)
- [ ] **AC-9** Spending per category this month is shown next to the average of the previous months; transfers are excluded; checked by test (R-12)
- [ ] **AC-10** A category over budget is shown in a distinct state with the amount over; checked by walkthrough (R-14; applies when the optional budgets are built)

**W-7 Recurring** (applies when the optional recurring payments are built)
- [ ] **AC-11** A monthly payment appears on every due day in the calendar, and a due one is posted only after one tap; checked by walkthrough (R-15, R-16)

**All**
- [ ] **AC-12** Without logging in, no page or data endpoint returns financial data, and sign-up without an invite fails; checked by test (R-17)
- [ ] **AC-13** One action downloads all accounts, transactions, snapshots and budgets in a file that can be imported again; checked by test (R-18)
- [ ] **AC-14** The app installs to a phone home screen and is usable at 375 px and 1280 px wide; checked by walkthrough (R-24)
- [ ] **AC-15** An expense on a EUR account keeps its EUR amount, counts in CZK totals and budgets at that day's rate, and a CZK to EUR transfer records both amounts; if no rate is available, the last known rate is used and marked; checked by test (R-23)
- [ ] **AC-16** Every screen is in Czech, with amounts like 1 234,50 Kč and dates like 26. 11. 2026; checked by walkthrough (R-25)

## Requirements and constraints

Approved requirements, confirmed facts and constraints the build must respect.

- **R-1** Log an expense or income with amount, category, account, date, optional what and note, with account and date pre-filled
- **R-2** Record transfers between own accounts, including paying off a credit card, without counting them as spending
- **R-3** Edit, delete and immediately undo a transaction
- **R-4** Manage own categories
- **R-7** Hold accounts of type checking, credit card, savings, brokerage, crypto, managed fund and retirement
- **R-8** Record a monthly value per investment account and keep the history
- **R-10** Show net worth over time, and its composition by kind of account
- **R-11** Show balance over time per account
- **R-12** Compare spending by category between months
- **R-17** Require login; nobody can sign up without an invite
- **R-18** Export all data as a file at any time
- **R-23** Each account holds CZK, EUR or USD; totals, budgets and charts convert to CZK by default, and can be shown in EUR or USD
- **R-24** Installable on a phone home screen; layout for phone and desktop
- **R-25** The interface is in Czech, with Czech number, date and currency formats
- **C-1** Free to run
- **C-2** Runs on a subdomain now, maybe its own domain later
- **C-3** Web app installable as a PWA; no native app for now
- **C-4** Mobile first, desktop as well
- **C-5** Not public for now
- **C-6** Interface language Czech; base currency CZK
- **D-4** Hosted database: Turso (libSQL) with Drizzle; self-hosted installs use a plain SQLite file

No confirmed facts (`F-`) yet; the owner's statements S-1 to S-9 are in the brief.

## Open assumptions

Build on these as written. They are not confirmed; if one turns out wrong, stop and tell the owner.

| ID | Assumption | If wrong | How it gets confirmed |
| --- | --- | --- | --- |
| A-1 | Manual entry is wanted; no bank connection is needed | Scope grows to bank aggregators, usually paid and regulated | P-1 answers Q-9 |
| A-3 | The current tracker can export history as a file | History starts empty or is re-typed; trend charts stay thin for months | P-1 answers Q-1 (affects optional R-19) |
| A-4 | A monthly value per investment account is enough; no holdings, units or prices | Needs a holdings model and price data | P-1 answers Q-3; H-4 during the build |
| A-5 | Free hosting tiers carry one to a few users at no cost | Monthly cost or a move to self-hosting | H-3 spike early in the build |
| A-6 | Entry without a connection is not needed in the MVP | Entries are lost or blocked on poor signal | P-1 answers Q-7 |
| A-7 | Recurring payments post only after the owner confirms them | Needs automatic posting with correction | P-1 answers Q-5 (optional R-16) |
| A-8 | Budgets are monthly amounts per category, without rollover | Envelope-style budgeting changes the data model | P-1 answers Q-4 (optional R-14) |
| A-9 | Later users keep fully separate ledgers; no shared accounts | Shared accounts need permissions per account | P-1 answers Q-10; until then an owner id on every record |
| A-10 | Existing open-source trackers fall short on fast mobile entry or on charts | Adopting one would have been cheaper than building | Accepted by P-1, 2026-11-26, without the H-2 check (D-5); unverified |

## Open questions that do not block the start

- **Q-9** What frustrates you about the current tracker, and what do you like? Waiting on P-1; until answered, A-1 and A-10.
- **Q-1** Which tracker, can it export history, how far back? Waiting on P-1; until answered, A-3.
- **Q-3** Is one value per investment account per month enough, or split contributions from growth? Waiting on P-1; until answered, A-4.
- **Q-4** Budgets as monthly limits or rolling envelopes? Waiting on P-1; until answered, A-8.
- **Q-5** Recurring payments recorded automatically or on tap? Waiting on P-1; until answered, A-7.
- **Q-6** Is paying off the credit card recorded as a transfer? Waiting on P-1; until answered, a transfer between accounts.
- **Q-7** Any need to log without signal? Waiting on P-1; until answered, A-6.
- **Q-8** Roughly how many transactions a month? Waiting on P-1; until answered, 60 to 120, an estimate.
- **Q-10** Will friends share an account, or separate ledgers? Waiting on P-1; until answered, A-9.

## Success metrics

| ID | Metric | Type | Baseline | Target |
| --- | --- | --- | --- | --- |
| M-1 | Share of days with spending on which entries were logged the same day | leading | unknown: read from current tracker history before switching (Q-8) | 90%, a target |
| M-2 | Median time to log one transaction on a phone | leading | unknown: time 10 entries in the current tracker | 6 seconds or less, a target |
| M-3 | Months in a row with all investment values entered | lagging | unknown: count from the owner's records | 12 of 12, a target |
| M-4 | Running cost per month | lagging | 0 today, reported (C-1) | 0, a target |

Hypotheses to test during the build: **H-1** keypad-first entry is fast enough to keep logging (MVP in daily use for 2 weeks: median 6 s or less and logging on 12 of 14 days; proposed targets); **H-3** free tiers host app and database at no cost (spike: deploy login plus database, read current limits); **H-4** monthly investment values make the net worth chart useful (enter 6 to 12 months of the owner's values).

## Material risks

- **RK-1** Financial data on a third-party free tier: login from day one, no open sign-up, provider encryption at rest, no bank credentials ever stored.
- **RK-2** A free tier changes terms, sleeps or deletes inactive data: portable database, one-click full export, scheduled backup.
- **RK-3** Entry takes long enough that logging stops (the main risk): test with H-1 before building anything else.
- **RK-4** Scope grows into a full finance suite before the core loop works: ship the MVP slice first (D-3); new items are proposed, not added.
- **RK-5** Turso's site says it is joining Supabase; its free tier or product may change: libSQL is SQLite-compatible, so data moves without a schema change; keep R-18 export and the H-3 check.

## Decisions and rationale

- **D-1** Problem statement and stakeholders as above: matches the owner's own description; P-2 deferred until sharing.
- **D-2** Build the O-4 slice: fast entry and strong visuals are what the owner values most, and a focused slice can be shaped exactly to W-4 and W-6.
- **D-3** MVP scope, must requirements, acceptance criteria and validation plan as above: smallest scope that completes W-4, W-5 and W-6 end to end.
- **D-4** Turso (libSQL) with Drizzle; a plain SQLite file when self-hosted: same schema hosted and self-hosted.
- **D-5** Skip H-2 and build without first trying existing trackers: the owner's choice; A-10 accepted, unverified.

## For the engineering agent

- Implement only the must-have scope. Propose anything else to the owner; do not add it.
- Implementation choices (stack, architecture, data model) are not decided here unless listed as a constraint. D-4 and `tech-plan.md` (a suggestion, not decided) are the starting point.
- If an assumption proves wrong or an acceptance criterion cannot be met, stop and report it. The change goes back through the discovery brief, not this file.
