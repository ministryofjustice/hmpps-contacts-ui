import type { Express } from 'express'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode } from '../../../testutils/stubReferenceData'
import { MockedService } from '../../../../testutils/mockedServices'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let journey: AddContactJourney
beforeEach(() => {
  journey = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
    names: {
      lastName: 'last',
      firstName: 'first',
    },
    dateOfBirth: {
      isKnown: 'YES',
      day: 1,
      month: 1,
      year: 2024,
    },
    relationship: {
      relationshipToPrisoner: 'MOT',
      isEmergencyContact: true,
      isNextOfKin: true,
      comments: 'some comments',
    },
    mode: 'NEW',
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      referenceDataService,
      prisonerSearchService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = journey
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/add/cancel/:journeyId', () => {
  it('should render cancel page for mode NEW', async () => {
    // Given
    journey.mode = 'NEW'

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/cancel/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Are you sure you want to cancel adding the contact? - Add a contact - DPS')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to cancel adding First Last as a contact?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Add a contact and link to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=prisoner-and-contact-details]')).toHaveLength(0)
  })

  it('should render cancel page page for mode EXISTING', async () => {
    // Given
    journey.mode = 'EXISTING'
    journey.contactId = 12345

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/cancel/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to cancel linking the prisoner and the contact? - Link a contact to a prisoner - DPS',
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to cancel linking the prisoner and the contact?',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Link a contact to a prisoner')
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=prisoner-and-contact-details]')).toHaveLength(1)
    expect($('p > strong:contains("Contact:")').first().next().text().trim()).toStrictEqual('First Last (12345)')
    expect($('p > strong:contains("Prisoner:")').first().next().text().trim()).toStrictEqual('John Smith (A1234BC)')
  })

  it('should call the audit service for the page view', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/cancel/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_CANCEL_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/add/cancel/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/add/cancel/:journeyId', () => {
  it('should return to contact list and remove from session if cancelling', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/cancel/${journeyId}`)
      .type('form')
      .send({ action: 'YES' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/list')

    // Then
    expect(session.addContactJourneys![journeyId]).toBeUndefined()
  })

  it('should return to check answers if not cancelling', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/cancel/${journeyId}`)
      .type('form')
      .send({ action: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(session.addContactJourneys![journeyId]).not.toBeUndefined()
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/cancel/${uuidv4()}`)
      .type('form')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
