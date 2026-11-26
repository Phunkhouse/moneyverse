# 0002. Custom UI kit with SCSS Modules

Date: 2026-11-26  
Status: accepted

## Context

The prototype defines its own look: glass cards, gradients, a type and spacing scale, light and dark themes, a keypad sheet and hand-drawn SVG charts. The [tech plan](../discovery/money-tracker/tech-plan.md) suggested Tailwind CSS with shadcn/ui and Apache ECharts. On 2026-11-26 the owner asked for a small UI kit like Systerna's instead (Systerna's ADR 0033: own components in `src/ui/kit/`, SCSS Modules on tokens, native elements first, no headless library).

## Decision

- Own React components with **SCSS Modules** in `src/ui/kit/`, styled with CSS custom properties copied from the prototype's tokens. Global CSS holds only tokens, resets and document defaults.
- Native elements first: buttons are `<button>`, segmented controls are radio groups, the add sheet is a `<dialog>`. One state rule for hover, pressed, focus, disabled and busy.
- **Charts are our own SVG components** (line and area with crosshair and tooltip, stacked bars, horizontal bars), as in the prototype.
- A development-only `/dev/kit` page shows every component in every state.
- No Tailwind, shadcn/ui, Radix, React Aria, ECharts, Storybook or token tooling. Adding any of them needs a new decision record.

## Alternatives considered

- Tailwind and shadcn/ui (tech plan): fast for standard dialogs and sheets, but it adds a second styling system and the prototype's look would be overrides.
- Apache ECharts (tech plan): strong time series and zoom, but a large bundle for four simple chart types, and its look would need theming to match the prototype.

## Consequences

- Sheets, dialogs and charts are ours to make accessible and touch-friendly; their tests and the axe checks carry that weight.
- The bundle stays small, and the app looks like the prototype without fighting a library's defaults.
- Revisit if a component (most likely a listbox or a complex chart interaction) shows focus, screen-reader or touch defects that cannot be fixed at a reasonable cost.
