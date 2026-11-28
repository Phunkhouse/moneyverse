import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Automated accessibility checks (axe, WCAG 2.1 A and AA) on every screen, phone and desktop.

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // The Next.js development indicator is not part of the app; production builds have none.
    .exclude('nextjs-portal')
    .analyze()
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )
  expect(summary).toEqual([])
}

const screens = ['/', '/ucty', '/kategorie', '/transakce', '/plan', '/grafy']

for (const width of [375, 1280]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 } })

    for (const path of screens) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expectNoViolations(page)
      })
    }

    test('the monthly values sheet has no axe violations', async ({ page }) => {
      await page.goto('/ucty')
      await page.getByRole('button', { name: 'Zadat hodnoty' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== 'running'),
      )
      await expectNoViolations(page)
    })

    test('the quick add sheet has no axe violations', async ({ page }) => {
      await page.goto('/')
      const add = page.getByRole('button', { name: 'Přidat transakci' })
      await expect(add).not.toHaveAttribute('aria-disabled', 'true')
      await add.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      // Contrast is measured on the settled sheet, not halfway through its opening animation.
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== 'running'),
      )
      await expectNoViolations(page)
    })
  })
}

test.describe('dark theme', () => {
  test.use({ colorScheme: 'dark', viewport: { width: 375, height: 900 } })

  for (const path of screens) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectNoViolations(page)
    })
  }
})

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('the sign-in page has no axe violations', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/prihlaseni$/)
    await expectNoViolations(page)
  })
})
