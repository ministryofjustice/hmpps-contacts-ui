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

  test('lists restrictions with add, change and delete actions', async ({ page }) => {
    await signIn(page, listUrl)
    await expect(page.getByTestId('prisoner-restrictions-heading')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add a prisoner restriction' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Change/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Delete/ })).toBeVisible()
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

  test('deletes a restriction after confirmation', async ({ page }) => {
    const path = `${restrictionsApiPath}/${prisonerRestrictionId}`
    await stubWrite('DELETE', path, 204)
    await signIn(page, listUrl)
    await page.getByRole('link', { name: /Delete/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Are you sure you want to delete this prisoner restriction?',
    )
    await expectAccessible(page)

    await page.getByTestId('continue-button').click()
    await expect(page.getByTestId('success-banner')).toContainText('You’ve deleted a restriction for')
  })

  test('users without a maintenance role see greyed out actions explaining the roles needed', async ({ page }) => {
    await stubCommon(['PRISON', 'CONTACTS_ADMINISTRATOR'])
    await signIn(page, listUrl)
    await expect(page.getByTestId('prisoner-restrictions-heading')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add a prisoner restriction' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Change|Delete/ })).toHaveCount(0)
    await expect(page.getByTestId('add-prisoner-restriction-disabled')).toHaveAttribute(
      'title',
      /Contacts Authoriser or Update Alert role/,
    )
    await expect(page.getByTestId(`prisoner-restrictions-${prisonerRestrictionId}-change-disabled`)).toBeVisible()
    await expect(page.getByTestId('restrictions-roles-hint')).toContainText('Contacts Authoriser or Update Alert')
    await expectAccessible(page)
  })

  test('users with only the update alert role can maintain restrictions', async ({ page }) => {
    await stubCommon(['PRISON', 'UPDATE_ALERT'])
    await signIn(page, listUrl)
    await expect(page.getByRole('link', { name: 'Add a prisoner restriction' })).toBeVisible()
    await page.getByRole('link', { name: /Change/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Change a prisoner restriction')
  })
})
