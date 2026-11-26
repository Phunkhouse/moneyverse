# moneyverse

A personal money tracker: fast manual entry, every account including investments, and charts of where money goes and how net worth develops. Czech interface; CZK, EUR and USD. Built for one person now, maybe a few friends later. The app is not open for sign-up.

## How it works

Log an expense, income or transfer in a few taps from a keypad sheet. Cash-like accounts (checking, credit card, savings) get their balance from transactions; investment accounts (brokerage, crypto, funds, retirement) get one value a month. Everything converts to CZK for net worth, balance and category charts.

The code so far is the project setup; features arrive one PR at a time in the order in [the specification](docs/SPEC.md#planning-and-open-questions). Current state: [docs/STATUS.md](docs/STATUS.md).

## Getting started

Requires Node 26 (see `.nvmrc`) and pnpm (the version in `packageManager`).

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm verify` runs the format check, lint, typecheck and production build, as CI does.

## Documentation

- [Project specification](docs/SPEC.md): scope, acceptance criteria, technical approach, limitations and open questions.
- [Design source of truth](docs/design/README.md): the clickable prototype, its design system and the logo.
- [Decision records](docs/decisions/README.md): reasons for significant technical or product choices.
- [Assumptions](docs/assumptions.md), [backlog](docs/BACKLOG.md) and [runbook](docs/runbook.md).
- [Discovery](docs/discovery/money-tracker/handover.md): what was approved before coding started, and why.

Agents working in this repository follow [AGENTS.md](AGENTS.md).
