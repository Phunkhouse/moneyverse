# Walkthrough checklist

The acceptance criteria marked *walkthrough* in [SPEC.md](SPEC.md) are checked by the owner on the real app: on the phone (installed to the home screen) and on a computer at about 1280 px. Tick each one in SPEC.md with the date when it passes, or note what failed.

Automated tests already cover the same flows with invented data (`pnpm e2e`); this is the human check on real devices.

## Before you start

- Production is migrated (`pnpm db:migrate:prod` ends with all tables present) and you are signed in.
- Use a test account and category you can delete afterwards, or do this after backups exist, so real entries are safe.

## AC-14 Install and layout (R-24)

1. **iPhone (Safari):** open https://money.david-krapka.eu, Share → Add to Home Screen. The icon is the Glass trio on a light tile; the name is "moneyverse".
2. **Android (Chrome):** menu → Install app (or Add to Home screen).
3. Open it from the home screen: it starts without the browser bar, on Přehled, signed in.
4. Launch screen: with the phone in dark mode it is light (#f3f1fb); a manifest cannot follow the system theme. Note whether that bothers you (BACKLOG item from the PR #4 review).
5. On a computer at about 1280 px: the sidebar is on the left with "Přidat transakci"; nothing overlaps or scrolls sideways.

## AC-1 Quick add in 3 taps (R-1)

1. On the phone, tap **+**. The keypad is ready.
2. Type an amount (for example 129). The account used last and **Dnes** are already selected.
3. Tap a category, then **Uložit výdaj**: two taps after the amount (3 at most passes).
4. A toast says "Uloženo 129 Kč · …"; the entry is at the top of Přehled.

## AC-3 Undo, edit and delete (R-3)

1. Right after saving, tap **Zpět** in the toast: the entry disappears.
2. Save another entry, open it from Přehled or Transakce, change the amount, save: the list and the account balance change.
3. Open it again, **Smazat transakci**: it disappears; **Zpět** brings it back.
4. Check that Grafy (spending by month) moved accordingly.

## AC-4 New category during entry (R-4)

1. In quick add, tap **+ Nová**, type a name, **Přidat**: it is selected without leaving the sheet.
2. Save; the category is listed in Kategorie.

## AC-6 Monthly investment values (R-8)

1. After a month has turned, Přehled shows "Je čas zadat hodnoty investic za …". Tap **Zadat**.
2. All investment accounts are on one screen. Enter values for some, leave one empty, save.
3. The empty one shows "převzato" on its account page for that month; the others show the value.

## AC-7 Net worth over 12 months (R-10)

1. Calculate by hand the net worth at the end of last month: the sum of every account's balance (debts negative; EUR and USD at that month's last ČNB rate, as shown on the account).
2. On Grafy, hover or tap last month on "Složení čistého jmění": the tooltip shows cash, investments, debts and the total. The total matches your calculation (to the haléř).
3. Switch between 6 and 12 months.

## AC-13 Export and import (R-18)

1. Přehled → Nastavení → **Data** → **Stáhnout soubor**. A file `moneyverse-YYYY-MM-DD.json` downloads; keep it somewhere private (never in the public repository).
2. Importing needs an empty app, so it is checked by the automated test; you can try that the button refuses a second import ("V aplikaci už jsou data").

## AC-16 Czech everywhere (R-25)

1. Visit every screen (Přehled, Účty, an account, Transakce, Plán, Grafy, Kategorie, Data, a 404 such as /neexistuje) in light and dark.
2. Every text is Czech; amounts look like 1 234,50 Kč and dates like 26. 11. 2026.
