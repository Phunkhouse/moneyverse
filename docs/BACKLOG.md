# Backlog

The single home for work not yet started, when the project keeps its backlog in the repository. The owner sets the order; agents propose items, they do not reorder them.

## Next

MVP build order, one PR at a time ([SPEC](SPEC.md#planning-and-open-questions)):

- Dashboard and charts. AC-7, R-10 to R-12.
- Export and re-import; PWA and phone checks. AC-13, AC-14. Check the installed app's launch screen in dark mode: the manifest's `background_color` and `theme_color` are the light `#f3f1fb`, and a manifest cannot follow the system theme (PR #4 review).

## Later

- Full Content-Security-Policy with nonces for scripts and styles; today's CSP covers only `frame-ancestors`, `base-uri`, `form-action` and `object-src` (`next.config.ts`). From the PR 1 review, 2026-11-26.
- Nastavení screen as in the prototype: theme (Podle systému, Světlý, Tmavý), display currency for totals, sign-out. Replaces the temporary "Nastavení" card on Přehled. Owner, 2026-11-27, from PR #4.

Proposed in the discovery brief; the owner orders them after H-1.

- Budgets per category with overspending (R-14, AC-10). Depends on Q-4.
- Recurring payments with calendar and one-tap confirm (R-15, R-16, AC-11). Depends on Q-5.
- Import history from the current tracker (R-19). Depends on Q-1.
- Spending trends over 6 and 12 months (R-13).
- Search by text, account and category (R-6).
- Offline entry queue (R-5). Depends on Q-7.
- Reminder when monthly values are due (R-9).
- Several users with separate ledgers (R-20); legal planning before it.
- Self-hosting from one container with a SQLite file (R-21).

## Not planned

- Bank connections (R-22), holdings and prices per security, public sign-up, native apps: non-goals of the [discovery handover](discovery/money-tracker/handover.md), 2026-11-26.
