import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import AuditService, { Page } from '../../../services/auditService'
import ContactsService from '../../../services/contactsService'
import TestData from '../../testutils/testData'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import RestrictionClass = journeys.RestrictionClass

jest.mock('../../../services/auditService')
jest.mock('../../../services/contactsService')
jest.mock('../../../services/prisonerSearchService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

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

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/success', () => {
  it.each([
    ['CONTACT_GLOBAL', 'New global restriction recorded'],
    ['PRISONER_CONTACT', 'New prisoner-contact restriction recorded'],
  ])('should render success for restriction class %s', async (restrictionClass: RestrictionClass, message: string) => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    const contactDetails = TestData.contact()
    contactsService.getContact.mockResolvedValue(contactDetails)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactDetails.id}/relationship/123456/restriction/add/${restrictionClass}/success`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect($('.govuk-panel__title').text().trim()).toStrictEqual(message)
    expect($('[data-qa=prisoner-name]').text().trim()).toContain('John Smith')
    expect($('[data-qa=contact-name]').text().trim()).toContain('Jones Mason')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
    expect($('[data-qa=breadcrumbs] a').eq(0).attr('href')).toStrictEqual('http://localhost:3001')
    expect($('[data-qa=breadcrumbs] a').eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
    expect($('[data-qa=breadcrumbs] a').eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
    expect($('[data-qa=go-to-contact-info-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/22/relationship/123456',
    )
    expect($('[data-qa=go-to-contacts-list-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/list',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contact restrictions')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    const contactDetails = TestData.contact()
    contactsService.getContact.mockResolvedValue(contactDetails)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactDetails.id}/relationship/123456/restriction/add/CONTACT_GLOBAL/success`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SUCCESSFULLY_ADDED_RESTRICTION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})