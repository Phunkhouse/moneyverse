# Discovery brief: Personal money tracker

- **Status:** handed over
- **Format:** 2
- **Profile:** Standard; budget 4 hours across sessions, used 1.5; checkpoint C
- **Decision owner:** Owner and primary user (P-1)
- **Updated:** 2026-11-26 by Claude (session 3)

## Resume here

- **Done:** Sessions 1 and 2 drafted checkpoints A to C and recorded R-23, R-25 and D-4. Session 3: P-1 approved D-1 to D-3 and waived H-2 (D-5, A-10 accepted); handover written (D-6).
- **Waiting on:** P-1 to answer Q-1 and Q-3 to Q-10 during the build; none blocks the start.
- **Next step:** Engineering fills `docs/SPEC.md` and `docs/assumptions.md` from `handover.md`. Changes to problem, scope or criteria come back here first.

## Problem

- **Request:** A personal web app (PWA) for tracking money: fast manual entry, all account types including investments, budgets, a recurring-payments calendar and strong charts; later shareable with friends or self-hosted. (SRC-1)
- **Problem statement:** A developer who tracks every transaction by hand, and investment values monthly, struggles to see where money goes and how net worth develops when entries, investment values and charts are spread across a tracker and manual monthly bookkeeping, which leads to effort without the feedback that would make the effort pay off. It is solved when logging a transaction takes a few seconds and every account, including investments, feeds one set of charts and budgets the owner checks regularly.
- **Opportunity:** One user now (P-1), a handful of friends later (P-2). The value is the owner's time and financial insight; no money is earned. Evidence is the owner's own statements (S-1 to S-6); how much the current setup hurts is unknown (Q-9).
- **Affected:** P-1 directly; P-2 only later.
- **Today:** An existing money tracker for daily transactions, and hand-kept monthly values for investments (W-1 to W-3).
- **Why now:** The owner wants a tool shaped to their own workflow and a route to sharing it, while it is still cheap to change course.

## Stakeholders

| ID | Role | Interest in the outcome | Influence | Decides or informs | Position | Status |
| --- | --- | --- | --- | --- | --- | --- |
| P-1 | Owner and primary user; developer, very visual | Fast entry, one picture of all money, charts and trends; fears effort that does not pay back and running costs | high | decides D-1, D-2, D-3 | supports building (SRC-1) | reached |
| P-2 | Friends as future users, own accounts, maybe self-hosted | Privacy of their own data, easy start | low now | is affected | unknown | not yet reached |

- **Missing voices:** P-2 has not been heard. That is acceptable while the tool is single-user, but Q-10 decides how much of their needs to design for now.

## Register

- **SRC-1** Owner's request in the project thread, 2026-11-26
- **SRC-2** Owner's follow-up in the project thread: Czech language, three currencies, 2026-11-26
- **SRC-3** Owner's choice of Turso over Neon in the project chat, with Turso's site as read that day (relayed), 2026-11-26
- **SRC-4** Owner's approval in the Claude Code session: "Approve defaults" to a plan that asked to approve D-1 to D-3 and to waive H-2, 2026-11-26

| ID | Entry | Source | Status | Notes |
| --- | --- | --- | --- | --- |
| S-1 | Enters every transaction by hand: what, which account, when, category, optional description | SRC-1, P-1 | reported | |
| S-2 | Tracks checking, credit card, savings and investments (active portfolios, bitcoin, managed funds, retirement funds); investments by hand, monthly | SRC-1, P-1 | reported | |
| S-3 | Wants to set budgets | SRC-1, P-1 | reported | |
| S-4 | Wants a calendar of recurring payments | SRC-1, P-1 | reported | |
| S-5 | Great visual feedback matters most: net worth, balance over time, comparing balances and categories | SRC-1, P-1 | reported | |
| S-6 | The idea: add transactions fast now, benefit later from budgets, charts and trends | SRC-1, P-1 | reported | |
| S-7 | Later: friends use it with their own accounts, maybe self-hosted | SRC-1, P-1 | reported | |
| S-8 | Leans towards a JS stack (Next, Astro), open to suggestions | SRC-1, P-1 | reported | |
| S-9 | The app is in Czech; three currencies from the start, CZK as default, plus EUR and USD | SRC-2, P-1 | reported | Answers Q-2 |
| C-1 | Free to run | SRC-1 | reported | |
| C-2 | Runs on a subdomain now, maybe its own domain later | SRC-1 | reported | |
| C-3 | Web app installable as a PWA; no native app for now | SRC-1 | reported | |
| C-4 | Mobile first, desktop as well | SRC-1 | reported | |
| C-5 | Not public for now | SRC-1 | reported | |
| C-6 | Interface language Czech; base currency CZK | SRC-2 | reported | |
| A-1 | Manual entry is wanted; no bank connection is needed | S-1, S-6 | open | If wrong: scope grows to bank aggregators, usually paid and regulated. Check: Q-9. Plan: proceed. |
| A-2 | One currency is enough for the MVP | none stated | disproved by S-9 | If wrong: amounts, balances and charts need conversion rates. Check: Q-2. Plan: proceed, store a currency per account. |
| A-3 | The current tracker can export history as a file | none stated | open | If wrong: history starts empty or is re-typed; trend charts stay thin for months. Check: Q-1. Plan: validate first. |
| A-4 | A monthly value per investment account is enough; no holdings, units or prices | S-2 | open | If wrong: needs a holdings model and price data. Check: Q-3, H-4. Plan: proceed. |
| A-5 | Free hosting tiers carry one to a few users at no cost | C-1 | open | If wrong: monthly cost or a move to self-hosting. Check: H-3. Plan: validate first. |
| A-6 | Entry without a connection is not needed in the MVP | none stated | open | If wrong: entries are lost or blocked on poor signal. Check: Q-7. Plan: proceed; queue offline entries later. |
| A-7 | Recurring payments post only after the owner confirms them | none stated | open | If wrong: needs automatic posting with correction. Check: Q-5. Plan: proceed. |
| A-8 | Budgets are monthly amounts per category, without rollover | S-3 | open | If wrong: envelope-style budgeting changes the data model. Check: Q-4. Plan: proceed. |
| A-9 | Later users keep fully separate ledgers; no shared accounts | S-7 | open | If wrong: shared accounts need permissions per account. Check: Q-10. Plan: proceed, owner id on every record. |
| A-10 | Existing open-source trackers fall short on fast mobile entry or on charts | none; a belief behind building | accepted (P-1, 2026-11-26, SRC-4) | If wrong: adopting one is cheaper than building. Check: H-2, waived by D-5. Plan: proceed. |
| RK-1 | Financial data on a third-party free tier | C-1, C-5 | assumed | Privacy. Login from day one, no open sign-up, provider encryption at rest, no bank credentials ever stored. |
| RK-2 | A free tier changes terms, sleeps or deletes inactive data | A-5 | assumed | Vendor. Portable database, one-click full export, scheduled backup. |
| RK-5 | Turso's site says it is joining Supabase; its free tier or product may change | SRC-3 | known | Vendor. libSQL is SQLite-compatible, so the data moves to a local SQLite file or another libSQL host without a schema change; keep R-18 export and the H-3 check. |
| RK-3 | Entry takes long enough that logging stops, and the charts lose their value | S-6 | assumed | Adoption, the main risk. Test with H-1 before building anything else. |
| RK-4 | Scope grows into a full finance suite before the core loop works | S-1 to S-7 | assumed | Scope. Ship the MVP slice first (D-3); new items are proposed, not added. |

## Open questions

| ID | Question | Decision it changes | Ask | If unanswered | Status |
| --- | --- | --- | --- | --- | --- |
| Q-9 | What frustrates you about the tracker you use now, and what do you like about it? | D-2 | P-1 | A-10 | open |
| Q-1 | Which tracker do you use, and can it export your history (CSV or similar)? How far back does it go? | R-19, D-3 | P-1 | A-3 | open |
| Q-3 | For investments, is one value per account per month enough, or do you also want to split money you put in from growth? | R-8, R-13 | P-1 | A-4 | open |
| Q-2 | Do you use more than one currency (for example card spend abroad, or bitcoin valued in your home currency)? | R-23 | P-1 | A-2 | answered (S-9) |
| Q-4 | How do you want budgets to work: a monthly limit per category, or envelopes where leftovers roll over? | R-14 | P-1 | A-8 | open |
| Q-5 | When a recurring payment is due, should it be recorded automatically or wait for your tap? | R-16 | P-1 | A-7 | open |
| Q-6 | How do you record paying off the credit card today: as a transfer between accounts, or not at all? | R-2 | P-1 | Transfer between accounts | open |
| Q-7 | Do you ever need to log something with no signal (travel, underground)? | R-5 | P-1 | A-6 | open |
| Q-8 | Roughly how many transactions do you log in a month? | M-1 baseline | P-1 | 60 to 120, an estimate | open |
| Q-10 | When friends join, will anyone share an account with you (a household card), or is each ledger separate? | R-20 | P-1 | A-9 | open |

## User workflows

- **W-1 Log a transaction, today:** P-1 — makes a purchase or receives money → opens the current tracker → enters what, account, date, category, optional note → saves. Hurts at: unknown (Q-9). (S-1)
- **W-2 Monthly investment update, today:** P-1 — month ends → looks up each portfolio, wallet, fund and pension value → writes the values down by hand. Hurts at: manual, and the values sit apart from daily spending, so no single net worth view. (S-2)
- **W-3 Review money, today:** P-1 — wants to know where money goes and whether net worth grows → uses whatever the current tracker shows plus the manual values. Hurts at: unknown which charts are missing (Q-9). (S-5)
- **W-4 Log a transaction, with the solution:** P-1 — opens the app from the home screen → types the amount on a keypad that is ready immediately → taps a category (recent first) → account and date are already filled with the last used account and today → optionally adds what and a note → saves. Failure cases: wrong entry → undo from the confirmation, or edit and delete later; category missing → create it in place; no connection → see A-6. Replaces W-1.
- **W-5 Monthly snapshot, with the solution:** P-1 — the month turns and the app shows that values are due → one screen lists every investment account with last month's value → types new values → net worth updates. Failure cases: a skipped month → the last value carries forward and is marked as carried; a value in another currency → see A-2. Replaces W-2.
- **W-6 Review and plan, with the solution:** P-1 — opens the dashboard → sees net worth and its trend, this month's spending against budgets, and upcoming payments → drills into composition, balance over time, category comparisons and trends. Failure cases: little history → charts say how many months they cover; a budget overspent → shown in a distinct state with the amount over. Replaces W-3.
- **W-7 Recurring payments, with the solution:** P-1 — sets up rent, subscriptions, salary with a cadence → the calendar shows what is due and when → on the due date confirms with one tap, adjusting the amount if it changed. Failure cases: a payment not confirmed → stays flagged as due, never silently posted (A-7). New; today no equivalent (S-4).

## Options and recommendation

| ID | Option | Value | Effort | Risk | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| O-1 | Build the full custom PWA as requested | H | H | M | M | Fits every stated need; most effort before the first benefit; risk RK-4. |
| O-2 | Adopt an existing open-source, self-hostable tracker (for example Actual Budget or Firefly III) | M | L | L | L | Multi-user and self-hosting may come for free; fit with fast mobile entry and charts is untested (A-10, H-2). |
| O-3 | Keep the current tracker; add a spreadsheet for monthly investment values and net worth charts | L | L | L | L | Smallest change; whether it removes the pain depends on Q-9. |
| O-4 | Build the smallest slice of O-1: fast entry, all accounts, monthly snapshots, core charts, single user; budgets and recurring next | H | M | L | M | Delivers the core loop (W-4, W-5, W-6) in weeks of evenings, an estimate; keeps the path to O-1. |

**Recommendation (D-2, approved; its H-2 step waived by D-5):** Build O-4 as the first slice of O-1, after one evening testing O-2 (H-2). Fast entry and strong visuals are what the owner values most (S-5, S-6), and the owner is a developer, so a focused slice is affordable and can be shaped exactly to W-4 and W-6. The plan depends most on A-10 and on H-1 (entry stays fast enough to keep logging). If H-2 shows an existing tool covers fast entry and the charts, adopt it instead; if Q-9 shows the current tracker only lacks investment charts, O-3 is enough.

## Requirements

| ID | Requirement | Workflow | Priority | Based on | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| R-1 | Log an expense or income with amount, category, account, date, optional what and note, with account and date pre-filled | W-4 | must | S-1, S-6 | approved (D-3) | explicit |
| R-2 | Record transfers between own accounts, including paying off a credit card, without counting them as spending | W-4 | must | S-2 | approved (D-3) | inferred |
| R-3 | Edit, delete and immediately undo a transaction | W-4 | must | S-1 | approved (D-3) | inferred |
| R-4 | Manage own categories | W-4 | must | S-1 | approved (D-3) | explicit |
| R-5 | Log entries without a connection and sync them later | W-4 | should | A-6 | proposed | inferred |
| R-6 | Find transactions by text, account and category | W-4 | should | S-1 | proposed | inferred |
| R-7 | Hold accounts of type checking, credit card, savings, brokerage, crypto, managed fund and retirement | W-5 | must | S-2 | approved (D-3) | explicit |
| R-8 | Record a monthly value per investment account and keep the history | W-5 | must | S-2 | approved (D-3) | explicit |
| R-9 | Remind when monthly values are due | W-5 | could | S-2 | proposed | inferred |
| R-10 | Show net worth over time, and its composition by kind of account | W-6 | must | S-5 | approved (D-3) | explicit |
| R-11 | Show balance over time per account | W-6 | must | S-5 | approved (D-3) | explicit |
| R-12 | Compare spending by category between months | W-6 | must | S-5 | approved (D-3) | explicit |
| R-13 | Show spending trends per category over 6 and 12 months | W-6 | should | S-5, S-6 | proposed | explicit |
| R-14 | Set a monthly budget per category and see progress and overspending | W-6 | should | S-3 | proposed | explicit; owner may raise to must |
| R-15 | Define recurring payments and income with a cadence and see them on a calendar | W-7 | should | S-4 | proposed | explicit |
| R-16 | Confirm a due recurring payment in one tap, adjusting the amount | W-7 | should | S-4, A-7 | proposed | inferred |
| R-17 | Require login; nobody can sign up without an invite | all | must | C-5, RK-1 | approved (D-3) | inferred |
| R-18 | Export all data as a file at any time | all | must | RK-2 | approved (D-3) | inferred |
| R-19 | Import history from the current tracker | W-6 | should | A-3 | proposed | inferred |
| R-20 | Separate ledgers for several users | all | could | S-7, A-9 | proposed | explicit as later need |
| R-21 | Run self-hosted from one container | all | could | S-7 | proposed | explicit as later need |
| R-22 | Connect to banks automatically | W-4 | won't | A-1 | proposed | inferred |
| R-23 | Each account holds CZK, EUR or USD; totals, budgets and charts convert to CZK by default, and can be shown in EUR or USD | all | must | S-9 | approved | explicit; P-1, 2026-11-26 |
| R-25 | The interface is in Czech, with Czech number, date and currency formats | all | must | S-9 | approved | explicit; P-1, 2026-11-26 |
| R-24 | Installable on a phone home screen; layout for phone and desktop | all | must | C-3, C-4 | approved (D-3) | explicit |

## Scope

- **Must have:** Fast entry with transfers, edit and undo, own categories (R-1 to R-4); all account types and monthly snapshots (R-7, R-8); net worth, balance and category charts (R-10 to R-12); private login, export, installable responsive app (R-17, R-18, R-24); CZK, EUR and USD accounts with conversion (R-23); Czech interface (R-25).
- **Optional:** Budgets (R-14), recurring calendar and confirm (R-15, R-16), history import (R-19), trends (R-13), search (R-6), offline entry (R-5), reminder (R-9), then several users (R-20), self-hosting (R-21).
- **Non-goals:** Bank connections (R-22); trading, prices or holdings per security (A-4); public sign-up (C-5); native apps (C-3).
- **Deferred:** None yet.

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
- [ ] **AC-10** A category over budget is shown in a distinct state with the amount over; checked by walkthrough (R-14)

**W-7 Recurring**
- [ ] **AC-11** A monthly payment appears on every due day in the calendar, and a due one is posted only after one tap; checked by walkthrough (R-15, R-16)

**All**
- [ ] **AC-12** Without logging in, no page or data endpoint returns financial data, and sign-up without an invite fails; checked by test (R-17)
- [ ] **AC-13** One action downloads all accounts, transactions, snapshots and budgets in a file that can be imported again; checked by test (R-18)
- [ ] **AC-14** The app installs to a phone home screen and is usable at 375 px and 1280 px wide; checked by walkthrough (R-24)
- [ ] **AC-15** An expense on a EUR account keeps its EUR amount, counts in CZK totals and budgets at that day's rate, and a CZK to EUR transfer records both amounts; if no rate is available, the last known rate is used and marked; checked by test (R-23)
- [ ] **AC-16** Every screen is in Czech, with amounts like 1 234,50 Kč and dates like 26. 11. 2026; checked by walkthrough (R-25)

## Validation plan

| ID | Hypothesis | Test | Pass / fail | Time and cost | Decision it informs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| H-1 | We believe keypad-first entry with pre-filled account and date lets the owner log fast enough to keep logging every day. | Clickable prototype now, then the MVP in daily use for 2 weeks; time 20 real entries | Pass if median entry is 6 seconds or less and the owner logs on 12 or more of 14 days; fail if median is over 10 seconds or the owner returns to the old tracker. Thresholds are proposed targets. | Prototype: 15 minutes; MVP: 2 weeks of use | D-3, R-1 | untested |
| H-2 | We believe no existing open-source tracker meets the owner's needs for fast mobile entry and charts. | Try Actual Budget and Firefly III for one evening with one month of real data | Pass (build) if neither allows a phone entry in about 6 seconds and a net worth chart that includes monthly investment values; fail (adopt) if one does both | 2 to 3 hours; no cost | D-2 | untested; waived by D-5 |
| H-3 | We believe free tiers can host the app and database for up to 5 users at no cost for 12 months. | Spike: deploy login plus database on the chosen free tiers and read their current limits | Pass if usage fits at least 10 times inside the limits and nothing sleeps or deletes data within 30 days of no use; fail otherwise | 2 hours; no cost | Stack choice, RK-2 | untested |
| H-4 | We believe monthly values per investment account are enough to make the net worth chart useful. | Enter the last 6 to 12 months of values from the owner's records into the prototype or MVP | Pass if the owner can say whether and why net worth grew; fail if they need contributions or holdings to answer | 1 hour | R-8, A-4 | untested |

## Success

- **Outcome:** The owner logs every transaction within the day, updates investments monthly, and uses the charts and budgets to decide about spending and saving.
- **Could fail or backfire:** Logging fades after the novelty (M-1 drops); building the tool takes the time it was meant to save (watch time spent against the build phases); data loss on a free tier (export and backup checks).

| ID | Metric | Type | Baseline | Target |
| --- | --- | --- | --- | --- |
| M-1 | Share of days with spending on which entries were logged the same day | leading | unknown: read from current tracker history before switching (Q-8) | 90%, a target |
| M-2 | Median time to log one transaction on a phone | leading | unknown: time 10 entries in the current tracker | 6 seconds or less, a target |
| M-3 | Months in a row with all investment values entered | lagging | unknown: count from the owner's records | 12 of 12, a target |
| M-4 | Running cost per month | lagging | 0 today, reported (C-1) | 0, a target |

## Decisions

| ID | Decision | Rationale | Status | By and date |
| --- | --- | --- | --- | --- |
| D-1 | Checkpoint A: problem statement and stakeholders as above | Matches the owner's own description; P-2 deferred until sharing | approved | P-1, 2026-11-26 (SRC-4) |
| D-2 | Checkpoint B: build the O-4 slice, after the H-2 check | See recommendation | approved; H-2 step waived by D-5 | P-1, 2026-11-26 (SRC-4) |
| D-3 | Checkpoint C: MVP scope, must requirements, acceptance criteria and validation plan | Smallest scope that completes W-4, W-5 and W-6 end to end | approved | P-1, 2026-11-26 (SRC-4) |
| D-4 | Hosted database: Turso (libSQL) with Drizzle; self-hosted installs use a plain SQLite file | Same schema hosted and self-hosted (R-21); free limits reported at 5 GB storage, 500M row reads and 10M row writes a month (SRC-3, not yet checked in H-3) | approved | P-1, 2026-11-26 |
| D-5 | Skip H-2; build without first trying existing trackers. A-10 accepted, unverified | Owner chose to build (SRC-4) | approved | P-1, 2026-11-26 |
| D-6 | Hand over the approved scope to engineering (`handover.md`) | Gate met after D-1 to D-3 and D-5 | approved | P-1, 2026-11-26 |
