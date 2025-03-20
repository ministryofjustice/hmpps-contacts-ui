import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
const prisonerNumber = 'A1234BC'
beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => user,
  })
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it.each([
    ['NEW', 'New contact added and linked to prisoner'],
    ['EXISTING', 'Contact linked to prisoner'],
  ])('should render check answers page with dob for mode %s', async (mode, message: string) => {
    // Given
    contactsService.getContactName.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/prisoner/A1234BC/contact/${mode}/123456/654321/success`)

    // Then
    const $ = cheerio.load(response.text)
    expect($('.govuk-panel__title').text().trim()).toStrictEqual(message)
    expect($('[data-qa=prisoner-name]').text().trim()).toContain('John Smith')
    expect($('[data-qa=contact-name]').text().trim()).toContain('Jones Mason')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    expect($('[data-qa=breadcrumbs] a').eq(0).attr('href')).toStrictEqual('http://localhost:3001')
    expect($('[data-qa=breadcrumbs] a').eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
    expect($('[data-qa=breadcrumbs] a').eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    expect($('.govuk-caption-l')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/prisoner/A1234BC/contact/NEW/123456/654321/success`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SUCCESSFULLY_ADDED_CONTACT_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})
