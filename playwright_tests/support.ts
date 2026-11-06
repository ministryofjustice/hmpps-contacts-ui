import { expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { getMatchingRequests, resetStubs, stubFor } from '../integration_tests/mockApis/wiremock'
import auth from '../integration_tests/mockApis/auth'
import componentApi from '../integration_tests/mockApis/componentApi'
import contactsApi from '../integration_tests/mockApis/contactsApi'
import prisonerSearchApi from '../integration_tests/mockApis/prisonerSearchApi'
import TestData from '../server/routes/testutils/testData'
import pagedPrisonerRestrictionDetails from '../server/testutils/testPrisonerRestrictionsData'
import pagedPrisonerAlertsData from '../server/testutils/testPrisonerAlertsData'

export const prisonerNumber = 'A1234BC'
export const prisonerRestrictionId = 175317

export const prisoner = TestData.prisoner({ prisonerNumber, lastName: 'Prisoner', firstName: 'Test' })

export const existingRestrictions = pagedPrisonerRestrictionDetails({
  content: [
    {
      ...pagedPrisonerRestrictionDetails().content![0],
      prisonerNumber,
      prisonerRestrictionId,
      expiryDate: '2099-12-31',
    },
  ],
})

export async function stubCommon(roles: string[] = ['PRISON', 'CONTACTS_AUTHORISER']) {
  await resetStubs()
  await componentApi.stubComponentsMeta()
  await auth.stubSignIn({ roles })
  await contactsApi.stubRestrictionTypeReferenceData()
  await prisonerSearchApi.stubPrisonerById(prisoner)
  await prisonerSearchApi.stubPrisonerRestrictionsById(existingRestrictions)
  await prisonerSearchApi.stubPrisonerAlertsById(pagedPrisonerAlertsData({ prisonNumber: prisonerNumber }))
}

export const stubWrite = (method: 'POST' | 'PUT', urlPath: string, status: number, jsonBody?: unknown) =>
  stubFor({
    request: { method, urlPath },
    response: { status, headers: { 'Content-Type': 'application/json;charset=UTF-8' }, jsonBody },
  })

export async function lastRequestBody(method: string, urlPath: string) {
  const { body } = await getMatchingRequests({ method, urlPath })
  const requests = body.requests as { body?: string }[]
  const last = requests[requests.length - 1]
  return last?.body ? JSON.parse(last.body) : undefined
}

export async function signIn(page: Page, startUrl: string) {
  await page.goto(startUrl)
  const url = await auth.getSignInUrl()
  await page.goto(url)
}

export async function expectAccessible(page: Page, disableRules: string[] = []) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .disableRules(disableRules)
    .analyze()
  expect(results.violations).toEqual([])
}
