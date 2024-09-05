import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CreateContactJourney = journeys.CreateContactJourney

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const baseJourney: CreateContactJourney = {
  id: journeyId,
  lastTouched: new Date(),
  isCheckingAnswers: false,
  names: {
    lastName: 'last',
    firstName: 'first',
  },
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = { ...baseJourney }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/create/enter-dob/:journeyId', () => {
  it('should render contact page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/contacts/create/enter-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/contacts/create/enter-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})

describe('POST /contacts/create/enter-name', () => {
  it('should pass to success page if there are no validation errors and we created the contact with no dob', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isDobKnown: 'false' })
      .expect(302)
      .expect('Location', `/contacts/create/check-answers/${journeyId}`)

    const expectedDob = { isKnown: false }
    expect(session.createContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it.each([
    ['01', '06', '1982', new Date('1982-06-01T00:00:00.000Z')],
    ['1', '6', '1982', new Date('1982-06-01T00:00:00.000Z')],
  ])(
    'should pass to success page if there are no validation errors and we created the contact with a dob',
    async (day, month, year, expected) => {
      await request(app)
        .post(`/contacts/create/enter-dob/${journeyId}`)
        .type('form')
        .send({ isDobKnown: 'true', day, month, year })
        .expect(302)
        .expect('Location', `/contacts/create/check-answers/${journeyId}`)

      // Then
      const expectedDob = {
        isKnown: true,
        dateOfBirth: expected,
      }
      expect(session.createContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
    },
  )

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/contacts/create/enter-dob/${journeyId}`)
  })
  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})
