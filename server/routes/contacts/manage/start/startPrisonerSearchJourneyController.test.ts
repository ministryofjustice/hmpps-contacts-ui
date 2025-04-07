import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import ManageContactsJourney = journeys.ManageContactsJourney
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')

const auditService = MockedService.AuditService()

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<ManageContactsJourney>

beforeEach(() => {
  app = appWithAllRoutes({
    services: { auditService },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.manageContactsJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: ManageContactsJourney) => {
          session.manageContactsJourneys![journey.id] = journey
        })
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
  preExistingJourneysToAddToSession = []
})

describe('GET /prisoner-search', () => {
  it('should create the journey and redirect to the prisoner search page', async () => {
    const response = await request(app).get('/prisoner-search')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACTS_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain('/contacts/manage/prisoner-search/')
    expect(Object.entries(session.manageContactsJourneys!)).toHaveLength(1)
  })

  it('validate a journey ID is added to the URL and the session', async () => {
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        search: {
          searchTerm: 'hello',
        },
      },
    ]

    const response = await request(app).get('/prisoner-search')

    // Get the redirect location from the response headers
    const { location } = response.headers

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACTS_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/manage/prisoner-search/')
    expect(Object.entries(session.manageContactsJourneys!)).toHaveLength(2)

    // Get the most recent UUID added and check it is present in the journey map
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(session.manageContactsJourneys![newId]!.id).toEqual(newId)
    expect(session.manageContactsJourneys![newId]!.lastTouched).toBeTruthy()
  })

  it('should not remove existing journeys when less than max exist', async () => {
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        search: {
          searchTerm: 'hello',
        },
      },
    ]

    const response = await request(app).get('/prisoner-search')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACTS_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain('/contacts/manage/prisoner-search/')
    expect(Object.entries(session.manageContactsJourneys!)).toHaveLength(2)
  })

  it('should remove the oldest journey if there will be more than 5 journeys', async () => {
    preExistingJourneysToAddToSession = [
      { id: 'old', lastTouched: new Date(2024, 1, 1, 11, 30).toISOString() },
      { id: 'middle-aged', lastTouched: new Date(2024, 1, 1, 12, 30).toISOString() },
      { id: 'youngest', lastTouched: new Date(2024, 1, 1, 14, 30).toISOString() },
      { id: 'oldest', lastTouched: new Date(2024, 1, 1, 10, 30).toISOString() },
      { id: 'young', lastTouched: new Date(2024, 1, 1, 13, 30).toISOString() },
    ]

    const response = await request(app).get('/prisoner-search')
    const { location } = response.headers

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACTS_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/manage/prisoner-search/')

    // Get the latest journey ID just added
    const newId = location!.substring(location!.lastIndexOf('/') + 1)

    // Check that the oldest journey has been replaced and still 5 are present
    expect(Object.keys(session.manageContactsJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
    expect(Object.entries(session.manageContactsJourneys!)).toHaveLength(5)

    // Check that the newest ID is present in the journey list
    expect(session.manageContactsJourneys![newId]!.id).toEqual(newId)
    expect(session.manageContactsJourneys![newId]!.lastTouched).toBeTruthy()
  })
})
