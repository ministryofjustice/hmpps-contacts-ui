import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import CreateContactJourney = journeys.CreateContactJourney

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
let existingJourney: CreateContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    isCheckingAnswers: false,
    names: {
      lastName: 'last',
      firstName: 'first',
    },
  }
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.createContactJourneys = {}
      session.createContactJourneys[journeyId] = { ...existingJourney }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/create/enter-estimated-dob/:journeyId', () => {
  it('should render enter estimated dob page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/contacts/create/enter-estimated-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    expect(response.text).toContain('Contacts')
    expect(response.text).toContain('Hmpps Contacts Ui')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if no validation errors but there are session values', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    existingJourney.dateOfBirth = { isKnown: 'NO', isOverEighteen: 'YES' }

    // When
    const response = await request(app).get(`/contacts/create/enter-estimated-dob/${journeyId}`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('input[type=radio]:checked').val()).toStrictEqual('YES')
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .get(`/contacts/create/enter-estimated-dob/${uuidv4()}`)
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})

describe('POST /contacts/create/enter-estimated-dob', () => {
  it('should pass to success page if there are no validation errors', async () => {
    // Given
    existingJourney.dateOfBirth = { isKnown: 'NO' }

    // When
    await request(app)
      .post(`/contacts/create/enter-estimated-dob/${journeyId}`)
      .type('form')
      .send({ isOverEighteen: 'NO' })
      .expect(302)
      .expect('Location', `/contacts/create/check-answers/${journeyId}`)

    // Then
    const expectedDob = { isKnown: 'NO', isOverEighteen: 'NO' }
    expect(session.createContactJourneys[journeyId].dateOfBirth).toStrictEqual(expectedDob)
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(`/contacts/create/enter-estimated-dob/${journeyId}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', `/contacts/create/enter-estimated-dob/${journeyId}`)
  })

  it('should return to start if no journey in session', async () => {
    await request(app)
      .post(`/contacts/create/enter-estimated-dob/${uuidv4()}`)
      .type('form')
      .send({})
      .expect(302)
      .expect('Location', '/contacts/create/start')
  })
})
