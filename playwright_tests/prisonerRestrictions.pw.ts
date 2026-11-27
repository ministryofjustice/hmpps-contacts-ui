import { expect, test } from '@playwright/test'
import {
  expectAccessible,
  lastRequestBody,
  prisonerNumber,
  prisonerRestrictionId,
  signIn,
  stubCommon,
  stubWrite,
} from './support'

const listUrl = `/prisoner/${prisonerNumber}/alerts-restrictions`
const restrictionsApiPath = `/prisoner-restrictions/${prisonerNumber}`

test.describe('Maintain prisoner restrictions', () => {
  test.beforeEach(async () => {
    await stubCommon()
  })

  test('lists restrictions with add, change and close actions', async ({ page }) => {
    await signIn(page, listUrl)
    await expect(page.getByTestId('prisoner-restrictions-heading')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add a prisoner restriction' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Change/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Close/ })).toBeVisible()
    await expectAccessible(page)
  })

  test('adds a restriction', async ({ page }) => {
    await stubWrite('POST', restrictionsApiPath, 201, { ...{ prisonerRestrictionId: 1 }, prisonerNumber })
    await signIn(page, listUrl)
    await page.getByRole('link', { name: 'Add a prisoner restriction' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Add a prisoner restriction')
    await expectAccessible(page)

    await page.getByLabel('Restriction type').selectOption({ index: 1 })
    await page.locator('#startDate').fill('01/02/2030')
    await page.locator('#expiryDate').fill('01/03/2030')
    await page.getByLabel('Comment on the restriction (optional)').fill('Created from DPS')
    await page.getByTestId('continue-button').click()

    await expect(page.getByTestId('success-banner')).toContainText('You’ve added a restriction for')
    const body = await lastRequestBody('POST', restrictionsApiPath)
    expect(body).toMatchObject({
      effectiveDate: '2030-02-01',
      expiryDate: '2030-03-01',
      commentText: 'Created from DPS',
    })
    expect(body.restrictionType).toBeTruthy()
  })

  test('validates the add form', async ({ page }) => {
    await signIn(page, listUrl)
    await page.getByRole('link', { name: 'Add a prisoner restriction' }).click()
    await page.getByTestId('continue-button').click()
    await expect(page.locator('.govuk-error-summary')).toContainText('Select the restriction type')
    await expect(page.locator('.govuk-error-summary')).toContainText('Enter the start date for the restriction')
    await expectAccessible(page)
  })

  test('changes a restriction', async ({ page }) => {
    const path = `${restrictionsApiPath}/${prisonerRestrictionId}`
    await stubWrite('PUT', path, 200, { prisonerRestrictionId, prisonerNumber })
    await signIn(page, listUrl)
    await page.getByRole('link', { name: /Change/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Change a prisoner restriction')
    await expect(page.locator('#startDate')).toHaveValue('02/10/2024')
    await expectAccessible(page)

    await page.getByLabel('Comment on the restriction (optional)').fill('Updated from DPS')
    await page.getByTestId('continue-button').click()

    await expect(page.getByTestId('success-banner')).toContainText('You’ve updated a restriction for')
    expect(await lastRequestBody('PUT', path)).toMatchObject({
      effectiveDate: '2024-10-02',
      commentText: 'Updated from DPS',
    })
  })

  test('closes a restriction today after confirmation', async ({ page }) => {
    const path = `${restrictionsApiPath}/${prisonerRestrictionId}/close`
    await stubWrite('POST', path, 200, {})
    await signIn(page, listUrl)
    await page.getByRole('link', { name: /Close/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Close a prisoner restriction')
    // govuk-frontend sets aria-expanded on conditional radios, which axe flags
    await expectAccessible(page, ['aria-allowed-attr'])

    await page.getByLabel('Today').check()
    await page.getByTestId('continue-button').click()
    await expect(page.getByTestId('success-banner')).toContainText('You’ve closed a restriction for')
    const body = await lastRequestBody('POST', path)
    expect(body.expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('closes a restriction on a future date', async ({ page }) => {
    const path = `${restrictionsApiPath}/${prisonerRestrictionId}/close`
    await stubWrite('POST', path, 200, {})
    await signIn(page, listUrl)
    await page.getByRole('link', { name: /Close/ }).click()
    await page.getByLabel('Another date').check()
    await page.locator('#expiryDate').fill('31/12/2098')
    await page.getByTestId('continue-button').click()
    await expect(page.getByTestId('success-banner')).toContainText('You’ve set a close date for a restriction for')
    expect(await lastRequestBody('POST', path)).toEqual({ expiryDate: '2098-12-31' })
  })

  test('validates the close form', async ({ page }) => {
    await signIn(page, listUrl)
    await page.getByRole('link', { name: /Close/ }).click()
    await page.getByLabel('Another date').check()
    await page.getByTestId('continue-button').click()
    await expect(page.locator('.govuk-error-summary')).toBeVisible()
  })

  for (const role of ['UPDATE_ALERT', 'PRISONER_PROFILE_SENSITIVE_EDIT']) {
    test(`users with only ${role} cannot view or maintain restrictions`, async ({ page }) => {
      await stubCommon(['PRISON', role])
      await signIn(page, listUrl)
      await expect(page.getByTestId('prisoner-restrictions-heading')).toHaveCount(0)
      const response = await page.goto(`/prisoner/${prisonerNumber}/restrictions/add`)
      expect(response?.status()).toBeGreaterThanOrEqual(400)
    })
  }
})
