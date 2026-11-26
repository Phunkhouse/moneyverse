# 0003. Money and currencies

Date: 2026-11-26  
Status: accepted

## Context

Accounts hold CZK, EUR or USD; totals, budgets and charts convert to CZK by default and can be shown in EUR or USD (R-23, AC-15). The owner approved storing money as whole minor units with the account's currency in the setup plan, 2026-11-26. Floating-point amounts lose cents in sums and comparisons.

## Decision

- Every amount is an **integer in minor units** (haléře, cents) with the **currency of its account**. No floats in storage or in server arithmetic.
- Transactions keep the amount in the account's currency. A transfer between accounts in different currencies stores **both amounts**, so the real bank rate is kept.
- Conversion to the base currency (CZK) uses the stored rate for the transaction's date: the latest published rate on or before that day. If none exists, the last known rate is used and the result is **marked** as estimated. Monthly investment values use the month's last rate.
- Conversion, totals and net worth are computed on the server. Rounding happens once, at conversion, half away from zero, to the target currency's minor unit.
- Budgets are kept in CZK.

## Alternatives considered

- Decimal strings or a decimal library: exact too, but slower to work with in SQL sums; integers are enough for three currencies with two decimal places.
- Converting at today's rate: simpler, but past totals would change every day and AC-15 asks for the rate of the day.

## Consequences

- Every amount column needs its currency next to it, through its account.
- Adding a currency with a different number of decimal places (for example JPY or BTC as a currency) needs a minor-unit table; revisit then.
- Rounding and missing-rate cases need unit tests (risk trigger "handles money").
