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
let journey: CreateContactJourney
beforeEach(() => {
  journey = {
    id: journeyId,
    lastTouched: new Date(),
    isCheckingAnswers: false,
    names: {
      lastName: 'last',
      firstName: 'first',
    },
    dateOfBirth: {
      isKnown: 'Yes',
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

describe('GET /contacts/create/check-answers', () => {
  describe('GET /contacts/create/check-answers/:journeyId', () => {
    it('should render check answers page with dob', async () => {
      // Given
      auditService.logPageView.mockResolvedValue(null)

      // When
      const response = await request(app).get(`/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(response.text).toContain('Contacts')
      expect(response.text).toContain('Hmpps Contacts Ui')
      expect(response.text).toContain('Check your answers')
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      expect(journey.isCheckingAnswers).toStrictEqual(true)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('1 January 2024')
    })

    it('should render check answers page without dob', async () => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      journey.dateOfBirth = { isKnown: 'No' }

      // When
      const response = await request(app).get(`/contacts/create/check-answers/${journeyId}`)

      // Then
      expect(response.status).toEqual(200)
      expect(response.text).toContain('Contacts')
      expect(response.text).toContain('Hmpps Contacts Ui')
      expect(response.text).toContain('Check your answers')
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      expect(journey.isCheckingAnswers).toStrictEqual(true)
      const $ = cheerio.load(response.text)
      expect($('.check-answers-dob-value').first().text().trim()).toStrictEqual('Not provided')
    })

    it('should return to start if no journey in session', async () => {
      await request(app)
        .get(`/contacts/create/check-answers/${uuidv4()}`)
        .expect(302)
        .expect('Location', '/contacts/create/start')
    })
  })
  describe('POST /contacts/create/check-answers/:journeyId', () => {
    it('should create the contact and pass to success page', async () => {
      // Given
      contactsService.createContact.mockResolvedValue(null)

      // When
      await request(app)
        .post(`/contacts/create/check-answers/${journeyId}`)
        .type('form')
        .expect(302)
        .expect('Location', '/contacts/create/success')

      // Then
      expect(contactsService.createContact).toHaveBeenCalledWith(journey, user)
      expect(session.createContactJourneys[journeyId]).toBeUndefined()
    })
    it('should return to start if no journey in session', async () => {
      await request(app)
        .post(`/contacts/create/check-answers/${uuidv4()}`)
        .type('form')
        .expect(302)
        .expect('Location', '/contacts/create/start')
    })
  })
})
