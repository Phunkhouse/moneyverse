# Design source of truth

The owner's clickable prototype is the approved design: [`prototype/moneyverse-prototype.html`](prototype/moneyverse-prototype.html) (also the private claude.ai artifact *Moneyverse Prototype*, `CdXVDGueGw3E69Q9NGXesS`, read 2026-11-26). Open it in a browser; its design system page is at `#design-system`. The prototype's numbers are invented sample data. It loads Google Fonts, so it looks right only when online.

The app rebuilds the prototype as React components with SCSS Modules ([ADR 0002](../decisions/0002-custom-ui-kit.md)). Where code and prototype differ, the prototype is the intended design; report the difference.

## Product and interaction principles

- Mobile first, desktop as well (C-4). Phone: a top bar, the screen, and a bottom bar with five slots (Přehled, Účty, a raised **+** for adding, Plán, Grafy). From 760 px of app width the bottom bar becomes a left sidebar with the logo and a full "Přidat transakci" button, and sheets become centred dialogs.
- Entry speed first (W-4, RK-3): the add sheet opens with the amount keypad ready; on desktop, typing digits goes to the amount and Enter saves. Recent categories first; the last account and today are pre-filled. Saving shows a toast with Undo, not a dialog.
- Exact values on hover or tap in every chart (AC-7), with a crosshair and a tooltip.
- Light, dark and "Podle systému" themes; the choice is in the top bar and in settings.
- Keyboard access, visible `:focus-visible` rings, reduced motion respected, Czech labels for every control.
- Amounts use tabular figures and Czech formats (`1 234,50 Kč`, `26. 11. 2026`). Amounts in another currency show their own currency, with the converted value where totals need it.

## Visual system

Defined on the prototype's design system page and in its CSS custom properties; the app copies them into its token files rather than restating them here.

- **Brand:** logo 02 "Glass trio" in [`brand/logo/`](brand/logo/) (three overlapping circles: violet `#5b5bf7`, pink `#ec4899`, cyan `#22d3ee`). Wordmark: lowercase Plus Jakarta Sans ExtraBold. The [logo concepts](brand/logo-concepts.html) record the other directions.
- **Type:** Sora for display, Plus Jakarta Sans for text. Six sizes (11, 13, 15, 19, 24, 34; 40 for the entry amount only) and four weights (400 text, 500 names and controls, 600 headings and amounts, 700 key figures).
- **Spacing:** 4, 8, 12, 16, 24, 32. Cards have 20 px padding on phones and 24 px on desktop.
- **Surfaces:** soft mesh background, glass cards, a gradient hero card, gradient primary buttons and selected states.
- **Colour roles:** ink in three steps, accent, positive, negative and warning with soft backgrounds, four chart series colours. Light and dark values for each.
- **Components:** button (primary, ghost, danger), segmented control, chip, card, hero card, banner, list rows (transaction, account, budget), progress bar, pill, sheet or dialog, keypad, text field and select, toast, calendar, line and area charts, horizontal bars, tooltip.

## Key screens and flows

All in the prototype: Přehled (dashboard with net worth hero), Rychlé zadání (quick add sheet), Účty (accounts by group), Hodnoty investic (monthly values), Transakce (by day), Rozpočty and Kalendář under Plán (backlog items R-14, R-15), Grafy (charts), Nastavení.

## Open design questions

None open.

## Differences from the prototype (proposal, owner to confirm)

- **Text contrast** (PR #7): the tertiary ink is darker in light mode (`#6c6689`, was `#8f8aa8`) and lighter in dark mode (`#928daf`, was `#827ca3`), and accent text on the soft accent background is mixed 20 % towards the ink. The prototype's values were below WCAG AA (4.5:1) for small text, which the axe checks enforce.
- **Quick add currency preview** (PR #7): the prototype showed "≈ … Kč" while typing a EUR or USD amount and pre-filled the arriving amount of a cross-currency transfer. Conversions happen only on the server (ADR 0003), so the sheet asks for the arriving amount instead and the list shows the converted value after saving.

- **When monthly values are due** (PR #10): the prototype's Přehled banner asks for the current month's values whenever they are missing. The app asks for **last month's** values once the month has turned (W-5: "when the month turns"), since they are month-end values; the sheet can switch to the current month too.

## Decided

- **Plán tab in the MVP** (owner, 2026-11-27): shown as "coming later". The tab stays in the navigation; it opens a short screen saying budgets and the payment calendar are coming, without sample data or controls. It becomes the real screen when R-14 or R-15 is built.
