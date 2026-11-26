# 0004. Invite-only passkey sign-in

Date: 2026-11-26  
Status: accepted

## Context

R-17 requires login, and nobody may sign up without an invite (AC-12). The data is personal and financial (RK-1), the repository is public, and the app must be free to run (C-1). The owner approved Better Auth with passkeys and invites as the default in the setup plan, 2026-11-26, with this record to settle the details. Friends may join later with separate ledgers (R-20, A-9).

## Decision

- **Better Auth 1.7** with its **passkey plugin**, on the app's own database through the Drizzle adapter, with transactions on. No password, email or social sign-in; Better Auth's email sign-up is disabled, so the only way to create a user is to accept an invite.
- **Invites** are created by the operator script `pnpm invite:create`. Each is a 32-byte random token valid for 24 hours, stored only as a SHA-256 hash in Better Auth's verification table (`storeIdentifier: 'hashed'`). The link carries the token in the URL fragment (`/pozvanka#…`), which browsers never send to the server.
- **Accepting** uses Better Auth's passkey-first registration: the invite is checked when the registration options are requested, and consumed when the passkey is verified. Consuming the invite, creating the user, storing the passkey and starting the session happen in one transaction (`createSession: true` is required), so a failed step leaves the invite unused.
- **A new device or a lost passkey** gets a new invite for the existing user (`--existing`); there is no other recovery path.
- **Sessions** are Better Auth database sessions in an HTTP-only cookie: 30 days, refreshed daily. Every page and server action checks the session against the database (`requireUser()` in `src/app/_lib/session.ts`); the proxy only redirects visitors without a cookie.
- **Rate limits** are stored in the database: 30 requests a minute per address and path, 10 for passkey endpoints. The client address comes from `x-forwarded-for`, which Vercel sets.
- The relying party is the host name of `BETTER_AUTH_URL`, so passkeys are bound to one domain.

## Alternatives considered

- Our own WebAuthn code on SimpleWebAuthn, as in Systerna: full control, but sessions, rate limits and passkey storage would all be ours to write and test.
- Auth.js (tech plan): passkey support was experimental, and invite-only sign-up would be custom anyway.
- Clerk (tech plan): a third party would hold the users; free tier limits.
- Email magic links: need an email provider and a sending domain, and an inbox becomes the key to the money data.

## Consequences

- No passwords to leak or reset. A user without any working passkey needs the operator to issue a new invite.
- Moving to another domain invalidates every passkey (they are bound to the host name); users then need new invites. Choose the production subdomain before real use.
- Self-hosting (R-21) needs a reverse proxy that sets `x-forwarded-for`, or rate limits share one bucket.
- The full WebAuthn ceremony is not covered by automated tests yet: unit and integration tests cover invites, refused sign-up, sessions and rate limits. A Playwright test with a virtual authenticator should be added with the first end-to-end tests.
- Revisit if Better Auth's passkey-first registration changes, or when friends join (R-20): an invite screen in the app may replace the script.
