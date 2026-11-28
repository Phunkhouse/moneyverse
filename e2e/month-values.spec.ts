import { expect, test } from '@playwright/test'

// AC-6 with invented data: the fund from global-setup.ts has no monthly values yet.

function months() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [y, m] = today.split('-').map(Number)
  const name = (year: number, month: number) => {
    const text = new Intl.DateTimeFormat('cs-CZ', {
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)))
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  const prev = m === 1 ? [y - 1, 12] : [y, m - 1]
  return { previous: name(prev[0], prev[1]), current: name(y, m) }
}

test('last month’s values are entered on one screen, and the current month carries them (AC-6)', async ({
  page,
}) => {
  const { previous, current } = months()
  await page.goto('/')
  const reminder = page.getByText(
    `Je čas zadat hodnoty investic za ${previous.toLowerCase()}`,
  )
  await expect(reminder).toBeVisible()
  await page.getByRole('button', { name: 'Zadat', exact: true }).click()

  const sheet = page.getByRole('dialog', { name: 'Hodnoty investic' })
  await expect(
    sheet.getByRole('button', { name: previous, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await sheet.getByLabel('Fond (CZK)').fill('12 500')
  await sheet
    .getByRole('button', {
      name: `Uložit hodnoty za ${previous.toLowerCase()}`,
    })
    .click()
  await expect(page.getByRole('status')).toContainText(
    `Uloženo 1 hodnota za ${previous.toLowerCase()}`,
  )
  await expect(reminder).toHaveCount(0)

  // The account shows last month's value as entered and this month as carried.
  await page.goto('/ucty')
  await page.getByRole('link', { name: /Fond/ }).click()
  const history = page.locator('section', {
    has: page.getByRole('heading', { name: 'Měsíční hodnoty' }),
  })
  await expect(
    history.getByText(new RegExp(`^${current}`)).locator('..'),
  ).toContainText(/12\s500\sKč · převzato/)
  await expect(
    history.getByText(new RegExp(`^${previous}`)).locator('..'),
  ).not.toContainText('převzato')
})

test('Undo puts the month back as it was', async ({ page }) => {
  const { current } = months()
  await page.goto('/ucty')
  await page.getByRole('button', { name: 'Zadat hodnoty' }).click()
  const sheet = page.getByRole('dialog', { name: 'Hodnoty investic' })
  await sheet.getByRole('button', { name: current, exact: true }).click()
  await sheet.getByLabel('Fond (CZK)').fill('13 000')
  await sheet.getByRole('button', { name: /Uložit hodnoty/ }).click()
  await expect(page.getByRole('status')).toContainText('Uloženo 1 hodnota')
  await page.getByRole('status').getByRole('button', { name: 'Zpět' }).click()
  await expect(page.getByRole('status')).toContainText('Vráceno zpět')

  await page.getByRole('link', { name: /Fond/ }).click()
  const history = page.locator('section', {
    has: page.getByRole('heading', { name: 'Měsíční hodnoty' }),
  })
  await expect(
    history.getByText(new RegExp(`^${current}`)).locator('..'),
  ).toContainText('převzato')
})

test('a value that is not an amount is refused next to its field', async ({
  page,
}) => {
  await page.goto('/ucty')
  await page.getByRole('button', { name: 'Zadat hodnoty' }).click()
  const sheet = page.getByRole('dialog', { name: 'Hodnoty investic' })
  await sheet.getByLabel('Fond (CZK)').fill('12x')
  await sheet.getByRole('button', { name: /Uložit hodnoty/ }).click()
  await expect(sheet.getByText('Zadejte částku jako')).toBeVisible()
})
