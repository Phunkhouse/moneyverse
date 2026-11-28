import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { E2E_STATE_EMPTY } from './env.ts'

// AC-13 with invented data: download everything, import it into an empty ledger.

test('downloads all data and imports it into an empty ledger (AC-13)', async ({
  page,
  browser,
}, testInfo) => {
  await page.goto('/data')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Stáhnout soubor' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(
    /^moneyverse-\d{4}-\d{2}-\d{2}\.json$/,
  )
  const path = testInfo.outputPath('export.json')
  await download.saveAs(path)
  const file = JSON.parse(
    await (await import('node:fs/promises')).readFile(path, 'utf8'),
  )
  expect(file).toMatchObject({ format: 'moneyverse-export', version: 1 })
  expect(file.accounts.map((a: { name: string }) => a.name)).toEqual(
    expect.arrayContaining(['Běžný účet', 'Karta', 'Fond']),
  )

  // A second user with nothing in the app imports the file.
  const empty = await browser.newContext({ storageState: E2E_STATE_EMPTY })
  const other = await empty.newPage()
  await other.goto('/data')
  await other.getByLabel('Soubor JSON').setInputFiles(path)
  await other.getByRole('button', { name: 'Nahrát data' }).click()
  await expect(other.getByText(/^Nahráno: 3 účty, 3 kategorie/)).toBeVisible()
  await other.goto('/ucty')
  await expect(other.getByRole('link', { name: /Běžný účet/ })).toBeVisible()
  await expect(other.getByRole('link', { name: /Fond/ })).toBeVisible()
  await empty.close()

  // The original user already has data, so the same file is refused there.
  await page.getByLabel('Soubor JSON').setInputFiles(path)
  await page.getByRole('button', { name: 'Nahrát data' }).click()
  await expect(page.getByText('V aplikaci už jsou data')).toBeVisible()
})

test('refuses a file that is not a moneyverse export', async ({
  browser,
}, testInfo) => {
  const path = testInfo.outputPath('wrong.json')
  await writeFile(path, JSON.stringify({ hello: 'world' }))
  const empty = await browser.newContext({ storageState: E2E_STATE_EMPTY })
  const page = await empty.newPage()
  await page.goto('/data')
  await page.getByLabel('Soubor JSON').setInputFiles(path)
  await page.getByRole('button', { name: 'Nahrát data' }).click()
  await expect(page.getByText('Tohle není platný soubor')).toBeVisible()
  await empty.close()
})

test('the download needs a valid session', async ({ playwright }) => {
  const anonymous = await playwright.request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: { cookie: 'better-auth.session_token=forged.value' },
  })
  const response = await anonymous.get('/api/export', { maxRedirects: 0 })
  expect(response.status()).toBe(401)
  await anonymous.dispose()
})
