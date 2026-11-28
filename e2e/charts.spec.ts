import { expect, test } from '@playwright/test'

// AC-7 and R-10 to R-12 with invented data from global-setup.ts.

test('Přehled shows net worth, and its chart gives the same exact value for this month (AC-7)', async ({
  page,
}) => {
  await page.goto('/')
  const hero = page
    .locator('section', { has: page.getByText('Čisté jmění', { exact: true }) })
    .first()
  // The big number: a div whose whole text is an amount, such as "59 700 Kč".
  const figure = (
    await hero
      .locator('div')
      .filter({ hasText: /^-?[\d\s\u00a0]+Kč$/ })
      .first()
      .innerText()
  ).trim()
  expect(figure).toMatch(/\d/)

  // Keyboard: focus the chart, and the left arrow selects the latest month.
  const chart = hero.getByRole('group', { name: 'Čisté jmění' })
  await chart.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(chart.getByRole('status')).toContainText(figure)
})

test('Grafy shows composition, spending and balances, with exact values on hover (AC-7)', async ({
  page,
}) => {
  await page.goto('/grafy')
  const composition = page.getByRole('group', { name: 'Složení čistého jmění' })
  await expect(composition).toBeVisible()

  // Hover: a tooltip with the month and the exact values by kind of account.
  const box = (await composition.locator('svg').boundingBox())!
  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2)
  const tip = composition.getByRole('status')
  await expect(tip).toContainText('Hotovost a spoření')
  await expect(tip).toContainText('Investice')
  await expect(tip).toContainText('Dluhy')

  // Every value is also in a table for screen readers.
  await expect(composition.locator('table caption')).toHaveText(
    'Složení čistého jmění',
  )

  await expect(
    page.getByRole('group', { name: 'Výdaje po měsících' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Karta' }).click()
  await expect(
    page.getByRole('group', { name: 'Zůstatek účtu Karta' }),
  ).toBeVisible()

  await page.getByRole('radio', { name: '6 měsíců' }).check()
  await expect(page.getByRole('radio', { name: '6 měsíců' })).toBeChecked()
})
