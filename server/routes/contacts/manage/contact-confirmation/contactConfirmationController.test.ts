import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    isContactConfirmed: undefined,
    returnPoint: { type: 'MANAGE_PRISONER_CONTACTS', url: '/foo-bar' },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/add/mode/EXISTING/confirmation/:journeyId?contactId=', () => {
  it('should render confirmation page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contacts())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}`,
    )
    const $ = cheerio.load(response.text)

    // Then
    expect(response.status).toEqual(200)
    expect($('.govuk-heading-l').text().trim()).toStrictEqual(
      'Is this the right person to add as a contact for Smith, John?',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('.govuk-tabs__tab:eq(0)').text().trim()).toStrictEqual('Contact details')
    expect($('.govuk-tabs__tab:eq(1)').text().trim()).toStrictEqual('Restrictions')
    expect($('.govuk-tabs__tab:eq(2)').text().trim()).toStrictEqual('Linked offenders')

    // Basic details
    expect($('h2.govuk-summary-card__title:eq(0)').text().trim()).toStrictEqual('Basic details')
    expect($('.govuk-summary-list__key:eq(0)').text().trim()).toStrictEqual('Name')
    expect($('.govuk-summary-list__key:eq(1)').text().trim()).toStrictEqual('Date of birth')
    expect($('.govuk-summary-list__key:eq(2)').text().trim()).toStrictEqual('Deceased date')

    // Addresses
    expect($('h2.govuk-summary-card__title:eq(1)').text().trim()).toStrictEqual('Addresses')
    expect($('.govuk-summary-card__actions .govuk-link').text().trim()).toContain('View all addresses')
    expect($('.govuk-summary-list__key:eq(3)').text().trim()).toStrictEqual('Address')
    expect($('.govuk-summary-list__key:eq(4)').text().trim()).toStrictEqual('Type')
    expect($('.govuk-summary-list__key:eq(5)').text().trim()).toStrictEqual('Address-specific phone numbers')
    expect($('.govuk-summary-list__key:eq(6)').text().trim()).toStrictEqual('Mail')
    expect($('.govuk-summary-list__key:eq(7)').text().trim()).toStrictEqual('Comments')
    expect($('.govuk-summary-list__key:eq(8)').text().trim()).toStrictEqual('Dates')

    // Phone numbers
    expect($('h2.govuk-summary-card__title:eq(2)').text().trim()).toStrictEqual('Phone numbers')
    expect($('.govuk-summary-list__key:eq(9)').text().trim()).toStrictEqual('Mobile')
    expect($('.govuk-summary-list__key:eq(10)').text().trim()).toStrictEqual('Business')

    // Email addresses
    expect($('h2.govuk-summary-card__title:eq(3)').text().trim()).toStrictEqual('Email addresses')
    expect($('.govuk-summary-list__key:eq(11)').text().trim()).toStrictEqual('Email addresses')

    // Identity numbers
    expect($('h2.govuk-summary-card__title:eq(4)').text().trim()).toStrictEqual('Identity numbers')
    expect($('.govuk-summary-list__key:eq(12)').text().trim()).toStrictEqual('Passport number')
    expect($('.govuk-summary-list__key:eq(13)').text().trim()).toStrictEqual('Driving licence')
    expect($('.govuk-summary-list__key:eq(14)').text().trim()).toStrictEqual('PNC number')

    // Language details
    expect($('h2.govuk-summary-card__title:eq(5)').text().trim()).toStrictEqual('Language details')
    expect($('.govuk-summary-list__key:eq(15)').text().trim()).toStrictEqual('Spoken language')
    expect($('.govuk-summary-list__key:eq(16)').text().trim()).toStrictEqual('Needs interpreter')

    // Radio
    expect($('.govuk-label:eq(0)').text().trim()).toStrictEqual('Yes, this is the right person')
    expect($('.govuk-label:eq(1)').text().trim()).toStrictEqual('No, this is not the right person')
    expect($('.govuk-button').text().trim()).toStrictEqual('Continue')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_CONFIRMATION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('GET /prisoner/:prisonerNumber/contacts/add/mode/EXISTING/confirmation/:journeyId?contactId=', () => {
  it('should pass validation when "Yes, this is the right person" is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=1`)
      .type('form')
      .send({ isContactConfirmed: 'YES' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=1`,
      )

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual('YES')
  })

  it('should pass validation when "No, this is not the right person" is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=1`)
      .type('form')
      .send({ isContactConfirmed: 'NO' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=1`,
      )

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual('NO')
  })

  it('should not pass validation when no option is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=1`)
      .type('form')
      .send({ isContactConfirmed: '' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/confirmation/${journeyId}?contactId=1`,
      )

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual(undefined)
  })
})
