# Assumptions register

Every working assumption and confirmed fact the product depends on, in one place. Approving a plan does not confirm an assumption: it stays open until the owner explicitly confirms the underlying fact or a reliable source verifies it.

When an entry changes, update the rules and tests that depend on it in the same change. IDs in brackets are the [discovery brief](discovery/money-tracker/brief.md)'s.

## Confirmed

| Id   | Fact or decision | Source and date | Depends on it |
| ---- | ---------------- | --------------- | ------------- |
| C-01 | The interface is Czech; base currency CZK (C-6, R-25) | Owner, 2026-11-26 (discovery brief S-9) | Message catalogue, formatters, AC-16 |
| C-02 | Accounts hold CZK, EUR or USD; totals convert to CZK and can be shown in EUR or USD (R-23) | Owner, 2026-11-26 (discovery brief S-9) | Money model, ADR 0003, AC-15 |
| C-03 | Database: Turso (libSQL) with Drizzle; a plain SQLite file when self-hosted (D-4) | Owner, 2026-11-26 (discovery brief SRC-3) | ADR 0001, schema |
| C-04 | Free to run (C-1); on a subdomain now (C-2); installable web app, no native app (C-3); mobile first, desktop too (C-4); not public, no open sign-up (C-5) | Owner, 2026-11-26 (discovery brief SRC-1) | Hosting, sign-in, layout |
| C-05 | The MVP scope, must requirements and AC-1 to AC-16 (D-1 to D-3); build without trying existing trackers first (D-5) | Owner, 2026-11-26 (discovery brief SRC-4) | `docs/SPEC.md` |
| C-06 | Setup: starter pack MVP profile, Standard CI, public repository, Claude PR review, small custom UI kit like Systerna's; backlog in `docs/BACKLOG.md`; the owner merges | Owner, 2026-11-26, in the setup session | `AGENTS.md`, ADR 0002 |
| C-07 | ČNB publishes free daily CZK rates for EUR and USD that a server can fetch (was O-12) | ČNB API documentation `https://api.cnb.cz/cnbapi/api-docs`, read and called 2026-11-27: `/exrates/daily` and `/exrates/daily-year`; a weekend returns the previous list with its `validFor` | `src/server/money/rates.ts`, AC-15, ADR 0005 |

## Open

| Id   | Working assumption | Depends on it | How it gets confirmed |
| ---- | ------------------ | ------------- | --------------------- |
| O-01 | Manual entry is wanted; no bank connection is needed (A-1) | Scope, non-goal R-22 | Owner answers Q-9 |
| O-02 | The current tracker can export history as a file (A-3) | Backlog item R-19 | Owner answers Q-1 |
| O-03 | One value per investment account per month is enough; no holdings, units or prices (A-4) | Snapshot model, R-8, R-10 | Owner answers Q-3; H-4: enter 6 to 12 months of the owner's values after the snapshot PR |
| O-04 | Free tiers (Vercel Hobby, Turso) host the app and database for up to 5 users at no cost for 12 months, without sleeping or deleting data (A-5) | Hosting, M-4 | H-3, partly checked. Turso free plan read by the owner 2026-11-27: 100 databases, 5 GB storage, 500 million rows read and 10 million rows written a month, 3 GB syncs, point-in-time restore 1 day, no restore of deleted databases. Expected use is far below 10 % of these (about 1,500 rows a year, an estimate, plus a rate-limit write per auth request). Still open: Vercel Hobby limits, and whether either service sleeps or deletes an idle project within 30 days (check on 2026-12-27) |
| O-05 | Entry without a connection is not needed in the MVP (A-6) | PWA without a service worker | Owner answers Q-7 |
| O-06 | Recurring payments post only after the owner confirms them (A-7) | Backlog items R-15, R-16 | Owner answers Q-5 |
| O-07 | Budgets are monthly amounts per category without rollover (A-8) | Backlog item R-14 | Owner answers Q-4 |
| O-08 | Later users keep fully separate ledgers; an owner id on every record is enough (A-9) | Schema, authorization | Owner answers Q-10 |
| O-09 | Existing open-source trackers fall short on fast mobile entry or charts (A-10); accepted by the owner without the H-2 check | The decision to build | Accepted, unverified (D-5). Revisit only if the owner asks |
| O-10 | Paying off the credit card is recorded as a transfer between accounts (Q-6) | R-2, AC-2 | Owner answers Q-6 |
| O-11 | Keypad-first entry with pre-filled account and date is fast enough to keep logging (H-1, RK-3) | Whether to continue to the backlog | H-1: two weeks of daily use after the quick-add PR; median 6 s or less, logging on 12 of 14 days (proposed targets) |
| O-13 | Vercel sets `x-forwarded-for` to the real client address, so per-address rate limits work (ADR 0004) | Rate limits on the auth API | Check after the first deploy: repeated sign-in attempts from one phone are limited, others are not |
| O-14 | An investment account's balance is its monthly value, carried forward when a month has none; transfers into it (contributions) do not change it until the next value | Balances and net worth for brokerage, crypto, managed fund and retirement accounts (ADR 0005) | Owner confirms, or H-4 (entering 6 to 12 months of values) shows net worth dips between values are confusing |

## Disproved

| Id  | Assumption | What showed it wrong, and when | What changed |
| --- | ---------- | ------------------------------ | ------------ |
| D-01 | One currency is enough for the MVP (A-2) | Owner, 2026-11-26 (S-9): CZK, EUR and USD from the start | R-23, per-account currency, ADR 0003 |
