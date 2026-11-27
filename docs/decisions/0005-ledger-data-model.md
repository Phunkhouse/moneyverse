# 0005. Ledger data model and exchange rates

Date: 2026-11-27  
Status: accepted

## Context

The MVP needs accounts of seven types, own categories, expenses, income and transfers, a monthly value for investment accounts with carried months, and ČNB rates for converting EUR and USD to CZK ([ADR 0003](0003-money-and-currencies.md), AC-2, AC-5, AC-8, AC-9, AC-15). Every record belongs to one user (A-9), and saving must be idempotent (SPEC, "Data and trust boundaries").

## Decision

- **Tables** (`src/server/db/schema.ts`, migration `drizzle/0001_money.sql`):
  - `money_account`: type, currency, a signed opening balance and its day, archived.
  - `category`: expense or income; names unique per user and kind, ignoring case.
  - `money_transaction`: one row per expense, income or transfer. The amount is always positive; the kind gives the direction. A transfer keeps both amounts (`amount_minor` out, `to_amount_minor` in), so cross-currency transfers record the bank's real rate.
  - `month_value`: one value per value-tracked account per month.
  - `exchange_rate` (ČNB list per `valid_for` day, rate as integer thousandths of CZK per `amount` units) and `exchange_rate_day` (which list applies to each checked calendar day).
- **Ownership in the database too:** every row has `user_id`, and composite foreign keys on `(id, user_id)` make a transaction or monthly value unable to point at another user's account or category. The server functions also scope every query by user id.
- **Idempotency:** the client chooses the transaction id (a UUID). Saving the same id and content again returns the stored row; the same id with other content is a conflict.
- **Balances:** checking, savings and credit card balances are the opening balance plus the transactions up to the day. Brokerage, crypto, managed fund and retirement balances are the month's value, else the last value carried forward and marked, else the opening value (assumption [O-14](../assumptions.md)). Debt is a negative balance, so net worth is a plain sum.
- **Rates:** a daily Vercel Cron (`/api/cron/rates`, secured by `CRON_SECRET`) fetches the ČNB JSON API (`https://api.cnb.cz/cnbapi/exrates/daily`) for each day not yet checked. A day counts as checked when ČNB returns its own list, or for a past day the list valid on it (weekends and holidays). Days not checked convert at the last known rate, marked as estimated. `pnpm rates:backfill` loads whole years (`/exrates/daily-year`).
- **Reports** load the user's rows once and sum in memory (about 1,500 rows a year); no SQL aggregates yet.

## Alternatives considered

- Two rows per transfer (one per account): simpler sums, but two rows to keep consistent on edit and delete; one row with both amounts is enough.
- Fetching rates on demand when converting: no cron or secret, but page loads would depend on ČNB being up and fast.
- The ČNB plain-text files: the JSON API is documented (OpenAPI at `https://api.cnb.cz/cnbapi/api-docs`) and easier to validate.
- Value-tracked balances as the last value plus transfers since: closer between snapshots, but contradicts "carry the last value forward" (AC-6); revisit with O-14.

## Consequences

- Deleting an account with transactions fails (foreign key); accounts are archived instead.
- Changing an account's currency is not supported; it would rewrite history.
- If Vercel Cron stops, conversions after the last checked day are marked estimated rather than wrong; Hobby runs the job once a day, somewhere within the scheduled hour.
