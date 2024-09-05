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
let preExistingJourneysToAddToSession: Array<CreateContactJourney>

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.createContactJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: CreateContactJourney) => {
          session.createContactJourneys[journey.id] = journey
        })
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/create/start', () => {
  it('should create the journey and redirect to enter-name page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get('/contacts/create/start')

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/create/enter-name/')
    expect(Object.entries(session.createContactJourneys)).toHaveLength(1)
  })

  it('should not remove any existing other journeys in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get('/contacts/create/start')

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/create/enter-name/')
    expect(Object.entries(session.createContactJourneys)).toHaveLength(1)
  })

  it('should not remove any existing other journeys in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date(),
        isCheckingAnswers: false,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get('/contacts/create/start')
    const { location } = response.headers

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/create/enter-name/')
    expect(Object.entries(session.createContactJourneys)).toHaveLength(2)
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(session.createContactJourneys[newId].id).toEqual(newId)
    expect(session.createContactJourneys[newId].lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      { id: 'old', lastTouched: new Date(2024, 1, 1, 11, 30), isCheckingAnswers: false },
      { id: 'middle-aged', lastTouched: new Date(2024, 1, 1, 12, 30), isCheckingAnswers: false },
      { id: 'youngest', lastTouched: new Date(2024, 1, 1, 14, 30), isCheckingAnswers: false },
      { id: 'oldest', lastTouched: new Date(2024, 1, 1, 10, 30), isCheckingAnswers: false },
      { id: 'young', lastTouched: new Date(2024, 1, 1, 13, 30), isCheckingAnswers: false },
    ]

    // When
    const response = await request(app).get('/contacts/create/start')
    const { location } = response.headers

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/create/enter-name/')
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(Object.keys(session.createContactJourneys).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})
