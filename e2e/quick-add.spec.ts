import { expect, test, type Page } from '@playwright/test'

// AC-1, AC-3 and AC-4 on a phone-sized screen, against invented data from global-setup.ts.

async function openQuickAdd(page: Page) {
  await page.goto('/')
  const add = page.getByRole('button', { name: 'Přidat transakci' })
  // The button waits until the user's accounts and categories have loaded.
  await expect(add).not.toHaveAttribute('aria-disabled', 'true')
  await add.click()
  const sheet = page.getByRole('dialog', { name: 'Nová transakce' })
  await expect(sheet).toBeVisible()
  return sheet
}

async function typeAmount(
  sheet: ReturnType<Page['getByRole']>,
  digits: string,
) {
  for (const digit of digits) {
    await sheet.getByRole('button', { name: digit, exact: true }).click()
  }
}

test('saves an expense in two taps after the amount, with account and date pre-filled (AC-1)', async ({
  page,
}) => {
  const sheet = await openQuickAdd(page)
  await typeAmount(sheet, '129')
  // Pre-filled: the account used last and today.
  await expect(sheet.getByRole('button', { name: 'Karta' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(sheet.getByRole('button', { name: 'Dnes' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  // Tap 1: the category. Tap 2: save.
  await sheet.getByRole('button', { name: 'Jídlo' }).click()
  await sheet.getByRole('button', { name: /Uložit výdaj/ }).click()

  await expect(page.getByRole('status')).toContainText('Uloženo 129 Kč · Jídlo')
  await expect(sheet).toBeHidden()
  const recent = page.locator('section', {
    has: page.getByRole('heading', { name: 'Poslední transakce' }),
  })
  await expect(
    recent.getByRole('button', { name: /Jídlo.*129\sKč/ }).first(),
  ).toBeVisible()
})

test('Undo removes the entry right after saving (AC-3)', async ({ page }) => {
  const sheet = await openQuickAdd(page)
  await typeAmount(sheet, '777')
  await sheet.getByRole('button', { name: 'Doprava' }).click()
  await sheet.getByRole('button', { name: /Uložit výdaj/ }).click()
  const recent = page.locator('section', {
    has: page.getByRole('heading', { name: 'Poslední transakce' }),
  })
  await expect(recent.getByText(/777\sKč/)).toBeVisible()

  await page.getByRole('status').getByRole('button', { name: 'Zpět' }).click()
  await expect(page.getByRole('status')).toContainText('Vráceno zpět')
  await expect(recent.getByText(/777\sKč/)).toHaveCount(0)
})

test('editing and deleting update the list and the balance (AC-3)', async ({
  page,
}) => {
  await page.goto('/transakce')
  await page.getByRole('button', { name: /Pečivo/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Upravit transakci' })
  // 50 Kč → 500 Kč
  await sheet.getByRole('button', { name: '0', exact: true }).click()
  await sheet.getByRole('button', { name: /Uložit změny/ }).click()
  await expect(page.getByRole('status')).toContainText('Změny uloženy')
  await expect(
    page.getByRole('button', { name: /Pečivo.*500\sKč/ }),
  ).toBeVisible()

  // The bank account started at 50 000 Kč and now has the 500 Kč expense.
  await page.goto('/ucty')
  await expect(
    page.getByRole('link', { name: /Běžný účet.*49\s500\sKč/ }),
  ).toBeVisible()

  await page.goto('/transakce')
  await page.getByRole('button', { name: /Pečivo/ }).click()
  await page
    .getByRole('dialog', { name: 'Upravit transakci' })
    .getByRole('button', { name: 'Smazat transakci' })
    .click()
  await expect(page.getByRole('status')).toContainText('Smazáno 500 Kč')
  await expect(page.getByRole('button', { name: /Pečivo/ })).toHaveCount(0)

  // Undo brings the deleted entry back.
  await page.getByRole('status').getByRole('button', { name: 'Zpět' }).click()
  await expect(page.getByRole('button', { name: /Pečivo/ })).toBeVisible()
})

test('creates a missing category during entry without leaving it (AC-4)', async ({
  page,
}) => {
  const sheet = await openQuickAdd(page)
  await typeAmount(sheet, '45')
  await sheet.getByRole('button', { name: '+ Nová' }).click()
  await sheet.getByLabel('Název nové kategorie').fill('Káva')
  await sheet.getByRole('button', { name: 'Přidat', exact: true }).click()
  await expect(sheet.getByRole('button', { name: 'Káva' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await sheet.getByRole('button', { name: /Uložit výdaj/ }).click()
  await expect(page.getByRole('status')).toContainText('Uloženo 45 Kč · Káva')
})

test('typing digits and Enter save on a computer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const sheet = await openQuickAdd(page)
  await page.keyboard.type('12,5')
  await sheet.getByRole('button', { name: 'Jídlo' }).click()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText(
    'Uloženo 12,50 Kč · Jídlo',
  )
})
