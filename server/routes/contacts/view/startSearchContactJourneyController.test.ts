import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { PrisonerPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import { MockedService } from '../../../testutils/mockedServices'
import { SearchContactJourney } from '../../../@types/journeys'
import { HmppsUser } from '../../../interfaces/hmppsUser'
import Permission from '../../../enumeration/permission'
import mockPermissionsWithoutPrisoner from '../../testutils/mockPermissionsWithoutPrisoner'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/auditService')

const auditService = MockedService.AuditService()

let app: Express
let session: Partial<SessionData>
let currentUser: HmppsUser
let preExistingJourneysToAddToSession: Array<SearchContactJourney>

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.searchContactJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: SearchContactJourney) => {
          session.searchContactJourneys![journey.id] = journey
        })
      }
    },
  })

  mockPermissionsWithoutPrisoner(app, adminUserPermissions)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /start', () => {
  it('should create the journey and redirect to search page', async () => {
    // Given

    // When
    const response = await request(app).get(`/start`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_SEARCH_START_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {},
    })
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain('/contacts/search/')
    expect(Object.entries(session.searchContactJourneys!)).toHaveLength(1)
  })

  it('should not remove any existing add journeys in the session', async () => {
    // Given
    preExistingJourneysToAddToSession = [
      {
        id: randomUUID(),
        lastTouched: new Date().toISOString(),
      },
    ]

    // When
    const response = await request(app).get(`/start`)
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/search/')
    expect(Object.entries(session.searchContactJourneys!)).toHaveLength(2)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(session.searchContactJourneys![newId]!.id).toEqual(newId)
    expect(session.searchContactJourneys![newId]!.lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        searchContact: {
          searchType: 'PARTIAL',
          contactId: '22',
        },
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        searchContact: {
          searchType: 'PARTIAL',
          contactId: '22',
        },
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        searchContact: {
          searchType: 'PARTIAL',
          contactId: '22',
        },
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        searchContact: {
          searchType: 'PARTIAL',
          contactId: '22',
        },
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        searchContact: {
          searchType: 'PARTIAL',
          contactId: '22',
        },
      },
    ]

    // When
    const response = await request(app).get(`/start`)
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/search/')
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(Object.keys(session.searchContactJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissionsWithoutPrisoner(app, {
      [Permission.read_contacts]: true,
      [Permission.edit_contacts]: false,
    } as Record<PrisonerPermission, boolean>)

    await request(app).get(`/start`).expect(403)
  })
})
