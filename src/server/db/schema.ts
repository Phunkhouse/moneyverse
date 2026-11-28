// Database schema. The tables below are the ones Better Auth 1.7 needs with the passkey plugin and
// database rate limiting, written by hand from `getAuthTables` (better-auth/db). Property names must
// match Better Auth's field names; the drizzle adapter maps them. The money tables follow them
// (ADR 0005).
import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

// Unused while sign-in is passkey-only; Better Auth expects the table to exist.
export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

// Short-lived values: WebAuthn challenges and invites. Identifiers are stored hashed
// (`verification.storeIdentifier: 'hashed'` in the auth config).
export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const passkey = sqliteTable(
  'passkey',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: integer('backed_up', { mode: 'boolean' }).notNull(),
    transports: text('transports'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }),
    aaguid: text('aaguid'),
  },
  (table) => [
    index('passkey_user_id_idx').on(table.userId),
    index('passkey_credential_id_idx').on(table.credentialID),
  ],
)

export const rateLimit = sqliteTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: integer('last_request').notNull(),
})

// ---- Money (ADR 0003, ADR 0005) ----
// Amounts are integer minor units in the account's currency. Every row carries its owner's user id;
// composite foreign keys on (id, user_id) stop a row from pointing at another user's account or
// category even if application code got it wrong.

export const moneyAccount = sqliteTable(
  'money_account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', {
      enum: [
        'checking',
        'credit_card',
        'savings',
        'brokerage',
        'crypto',
        'managed_fund',
        'retirement',
      ],
    }).notNull(),
    currency: text('currency', { enum: ['CZK', 'EUR', 'USD'] }).notNull(),
    // Signed: a card's debt is negative. For value-tracked types it is the value until the first
    // monthly value.
    openingBalanceMinor: integer('opening_balance_minor').notNull().default(0),
    openedOn: text('opened_on').notNull(),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique('money_account_id_user_unique').on(table.id, table.userId),
    index('money_account_user_idx').on(table.userId),
  ],
)

export const category = sqliteTable(
  'category',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['expense', 'income'] }).notNull(),
    name: text('name').notNull(),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique('category_id_user_unique').on(table.id, table.userId),
    unique('category_id_user_kind_unique').on(
      table.id,
      table.userId,
      table.kind,
    ),
    uniqueIndex('category_user_kind_name_unique').on(
      table.userId,
      table.kind,
      sql`lower(${table.name})`,
    ),
  ],
)

export const moneyTransaction = sqliteTable(
  'money_transaction',
  {
    // Chosen by the client before saving, so a repeated save is recognised (idempotency).
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['expense', 'income', 'transfer'] }).notNull(),
    date: text('date').notNull(),
    accountId: text('account_id').notNull(),
    // Always positive; the kind decides the direction.
    amountMinor: integer('amount_minor').notNull(),
    categoryId: text('category_id'),
    // A denormalised copy of the category's kind, so the composite key can require it to match.
    categoryKind: text('category_kind', { enum: ['expense', 'income'] }),
    toAccountId: text('to_account_id'),
    // The amount that arrived, in the target account's currency (both amounts are kept).
    toAmountMinor: integer('to_amount_minor'),
    what: text('what'),
    note: text('note'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountId, table.userId],
      foreignColumns: [moneyAccount.id, moneyAccount.userId],
    }),
    foreignKey({
      columns: [table.toAccountId, table.userId],
      foreignColumns: [moneyAccount.id, moneyAccount.userId],
    }),
    foreignKey({
      columns: [table.categoryId, table.userId, table.categoryKind],
      foreignColumns: [category.id, category.userId, category.kind],
    }),
    index('money_transaction_user_date_idx').on(table.userId, table.date),
    index('money_transaction_account_idx').on(table.accountId),
    index('money_transaction_to_account_idx').on(table.toAccountId),
    index('money_transaction_category_idx').on(table.categoryId),
    check('money_transaction_amount_positive', sql`${table.amountMinor} > 0`),
    check(
      'money_transaction_shape',
      sql`(${table.kind} = 'transfer' and ${table.toAccountId} is not null and ${table.toAmountMinor} > 0 and ${table.categoryId} is null and ${table.toAccountId} <> ${table.accountId})
        or (${table.kind} <> 'transfer' and ${table.toAccountId} is null and ${table.toAmountMinor} is null and ${table.categoryId} is not null and ${table.categoryKind} = ${table.kind})`,
    ),
  ],
)

// One value per value-tracked account per month (R-8). Months without a row carry the last value.
export const monthValue = sqliteTable(
  'month_value',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    month: text('month').notNull(),
    valueMinor: integer('value_minor').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      columns: [table.accountId, table.userId],
      foreignColumns: [moneyAccount.id, moneyAccount.userId],
    }).onDelete('cascade'),
    unique('month_value_account_month_unique').on(table.accountId, table.month),
    index('month_value_user_idx').on(table.userId),
  ],
)

// ČNB daily rates, shared by all users (public data). `rateMilli` is CZK in thousandths for
// `amount` units of the currency, exactly as ČNB publishes it (three decimals).
export const exchangeRate = sqliteTable(
  'exchange_rate',
  {
    validFor: text('valid_for').notNull(),
    currency: text('currency', { enum: ['EUR', 'USD'] }).notNull(),
    amount: integer('amount').notNull(),
    rateMilli: integer('rate_milli').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.validFor, table.currency] }),
    check(
      'exchange_rate_positive',
      sql`${table.amount} > 0 and ${table.rateMilli} > 0`,
    ),
  ],
)

// Which ČNB list applies to each calendar day that has been checked: the day's own list, or for a
// weekend or holiday the previous one. A day missing here converts at the last known rate, marked.
export const exchangeRateDay = sqliteTable('exchange_rate_day', {
  day: text('day').primaryKey(),
  validFor: text('valid_for').notNull(),
})
