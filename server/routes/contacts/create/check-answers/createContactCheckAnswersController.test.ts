import type { Express } from 'express'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ContactsService from '../../../../services/contactsService'
import CreateContactJourney = journeys.CreateContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let journey: CreateContactJourney
beforeEach(() => {
  journey = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { type: 'MANAGE_PRISONER_CONTACTS', url: '/foo-bar' },
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
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = journey
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it('should render check answers page with dob', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Check your answers')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('1 January 2024')
    expect($('[data-qa=contact-list-breadcrumb-link]').first().attr('href')).toStrictEqual('/foo-bar')
  })

  it('should render check answers page without dob', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    journey.dateOfBirth = { isKnown: 'NO' }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(journey.isCheckingAnswers).toStrictEqual(true)
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual('Check your answers')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('Not provided')
    expect($('[data-qa=contact-list-breadcrumb-link]').first().attr('href')).toStrictEqual('/foo-bar')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${uuidv4()}`)
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
describe('POST /prisoner/:prisonerNumber/contacts/create/check-answers/:journeyId', () => {
  it('should create the contact and pass to success page if return point is home', async () => {
    // Given
    contactsService.createContact.mockResolvedValue(null)
    journey.returnPoint = {
      type: 'HOME',
      url: '/ignored',
    }

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
      .type('form')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/success`)

    // Then
    expect(contactsService.createContact).toHaveBeenCalledWith(journey, user)
    expect(session.createContactJourneys[journeyId]).toBeUndefined()
  })

  it('should create the contact and pass to return url if return point is not home', async () => {
    // Given
    contactsService.createContact.mockResolvedValue(null)
    journey.returnPoint = {
      type: 'MANAGE_PRISONER_CONTACTS',
      url: '/some-prisoner-contact-page',
    }

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
      .type('form')
      .expect(302)
      .expect('Location', '/some-prisoner-contact-page')

    // Then
    expect(contactsService.createContact).toHaveBeenCalledWith(journey, user)
    expect(session.createContactJourneys[journeyId]).toBeUndefined()
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${uuidv4()}`)
      .type('form')
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/create/start`)
  })
})
