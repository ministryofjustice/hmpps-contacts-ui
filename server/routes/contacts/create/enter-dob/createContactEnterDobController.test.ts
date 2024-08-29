import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = {
        id: journeyId,
        names: {
          lastName: 'last',
          firstName: 'first',
        },
      }
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
  it('should pass to success page if there are no validation errors', async () => {
    await request(app)
      .post(`/contacts/create/enter-dob/${journeyId}`)
      .type('form')
      .send({ isDobKnown: 'false' })
      .expect(302)
      .expect('Location', '/contacts/create/success')
  })
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
