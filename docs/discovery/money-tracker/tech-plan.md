# Tech plan: Personal money tracker

Engineering suggestion that sits beside `brief.md`. The brief owns the problem, scope and decisions; this file proposes how to build the MVP slice (O-4) if D-2 is approved. Nothing here is decided. Stack choices are yours.

## Recommended stack

| Layer | Suggestion | Why | Alternative |
| --- | --- | --- | --- |
| App framework | **Next.js (App Router) + TypeScript** | You lean towards it; server actions keep forms simple; deploys free on Vercel Hobby; runs as one Node container for self-hosting | **SvelteKit** (smaller bundles, very pleasant forms). Astro fits content sites better than an app that is interactive on every screen, so I would not pick it here. |
| Database (**approved, D-4**) | **Turso (libSQL)** with **Drizzle ORM**; plain SQLite file when self-hosted | One schema runs hosted (Turso free tier) and self-hosted (a plain file in a Docker volume), which covers C-1 and R-21 without a rewrite | Postgres on Neon or Supabase free tiers; self-hosting then needs a Postgres container too. |
| Auth | **Better Auth** (email + passkey), invite-only | Multi-user ready from day one (R-17, R-20), runs on your own database, no per-user fees | Auth.js; Clerk free tier (third party holds your users). |
| UI | **Tailwind CSS + shadcn/ui** (Radix) | Fast to build accessible sheets, dialogs and segmented controls; you own the components | Plain CSS modules. |
| Charts | **Apache ECharts** (via `echarts-for-react`) | Strong time series, stacked areas, zoom and tooltips out of the box, good on touch | visx (more control, more work); Recharts (simpler, weaker on large series). |
| Language | **next-intl** with Czech as the only locale for now (R-25); `Intl.NumberFormat('cs-CZ')` and `Intl.DateTimeFormat('cs-CZ')` for money and dates | Czech now, other languages for friends later without rewriting screens | Plain dictionary file. |
| Exchange rates | **ČNB daily rates** (Czech National Bank publishes a free daily text file of CZK rates), fetched by a daily cron and stored | CZK is the base currency, so ČNB covers EUR and USD directly at no cost | Frankfurter (ECB rates). |
| PWA | **Serwist** (successor of next-pwa) + web manifest | Installable app (R-24); later an offline queue for entry (R-5) | Hand-written service worker. |
| Hosting | **Vercel Hobby** on a subdomain; **Turso** free database | Both free for personal use; custom subdomain supported (C-2) | Cloudflare Pages + D1; a small VPS with Docker if free tiers fail H-3. |

**Turso, as of 2026-11-26 (reported, check in H-3):** free tier of 5 GB storage, 500M row reads and 10M row writes a month, far above this app's needs (roughly 1,500 rows a year per user). Turso's site says it is joining Supabase, so watch for plan changes; because libSQL is SQLite-compatible, moving to a local SQLite file or another host needs no schema change (RK-5).

Run H-3 before committing: free-tier limits and sleep rules change, so read the current pages and deploy a login + database spike (about 2 hours).

## Data model sketch

Money is stored as integer minor units (cents), never floats. Every row carries `user_id` so several users can share one instance later (A-9).

```
users            id, email, name, base_currency (CZK), locale (cs), created_at
accounts         id, user_id, name, type, currency, opening_balance, opening_date, archived, sort
                 type: checking | credit | savings | cash | brokerage | crypto | fund | retirement
categories       id, user_id, name, parent_id?, kind (expense | income), icon, archived
transactions     id, user_id, account_id, date, amount, kind (expense | income | transfer),
                 category_id?, title?, note?, transfer_account_id?, transfer_amount?, recurring_id?, created_at
fx_rates         date, currency (EUR | USD), czk_per_unit        -- daily from ČNB
balance_snapshots id, account_id, month (YYYY-MM), value, carried (bool)
budgets          id, user_id, category_id, amount, valid_from (YYYY-MM)
recurring        id, user_id, account_id, category_id?, title, amount, kind,
                 rule (monthly on day N | every N months | yearly), next_due, auto_post (false)
```

- **Cash-like accounts** (checking, credit, savings, cash): balance = opening balance + transactions. A credit card balance is negative.
- **Investment-like accounts** (brokerage, crypto, fund, retirement): value = latest snapshot for the month; a missing month carries the previous value with `carried = true` (AC-6). Money moved in can be a transfer, so growth versus contributions is possible later (Q-3).
- **Currencies:** amounts are stored in the account's own currency (CZK, EUR or USD). Totals, budgets and charts convert to the base currency with the rate of the transaction's date (snapshots: the month's last rate). A transfer between currencies stores both amounts, so the real bank rate is kept. The display currency can be switched to EUR or USD; budgets are kept in CZK.
- **Net worth per month** = sum of month-end balances and snapshot values. Compute it in SQL views; volumes are tiny (Q-8 estimate: about 1,500 rows a year).

## Build phases

| Phase | Contents | Brief IDs | Rough size, an estimate |
| --- | --- | --- | --- |
| 0. Checks | H-2 (try two existing tools), H-3 (hosting spike) | D-2, A-5 | 1 evening each |
| 1. MVP | Auth with invite, accounts, categories, quick add sheet, transactions list with edit and undo, monthly snapshots, dashboard, net worth / balance / category charts, export | R-1 to R-4, R-7, R-8, R-10 to R-12, R-17, R-18, R-24 | 3 to 5 weekends |
| 2. Planning | Budgets, recurring payments with calendar and confirm, CSV import of history | R-14 to R-16, R-19 | 2 to 3 weekends |
| 3. Polish | Trends view, search, offline entry queue, snapshot reminder | R-5, R-6, R-9, R-13 | 2 weekends |
| 4. Sharing | Invites for friends, Docker image with SQLite volume, backup docs | R-20, R-21 | 1 to 2 weekends |

Run H-1 during phase 1: two weeks of daily use before starting phase 2.

## Entry speed details (H-1)

- The add sheet opens with the amount keypad focused; on desktop, typing digits goes straight into the amount and Enter saves.
- Categories are ordered by how often and how recently you use them; the last used account and today's date are pre-filled.
- Saving shows a short confirmation with Undo instead of a dialog.
- Optional "what" field suggests previous titles and their usual category.
