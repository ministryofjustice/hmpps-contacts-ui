import type { Express } from 'express'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CreateContactJourney = journeys.CreateContactJourney
import ContactsService from '../../../../services/contactsService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const journey: CreateContactJourney = {
  id: journeyId,
  lastTouched: new Date(),
  names: {
    lastName: 'last',
    firstName: 'first',
  },
  dateOfBirth: {
    isKnown: true,
    dateOfBirth: new Date('2024-01-01'),
  },
}
beforeEach(() => {
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
    it('should render contact page', async () => {
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
