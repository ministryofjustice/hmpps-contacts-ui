import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import AddContactJourney = journeys.AddContactJourney
import ReturnPoint = journeys.ReturnPoint

jest.mock('../../../../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<AddContactJourney>
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.addContactJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: AddContactJourney) => {
          session.addContactJourneys[journey.id] = journey
        })
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/create/start', () => {
  it('should create the journey and redirect to search page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/start`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/search/')
    expect(Object.entries(session.addContactJourneys)).toHaveLength(1)
  })

  it('should set the return point to prisoner contact if no return parameters are specified', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    const expectedReturnPoint: ReturnPoint = {
      type: 'PRISONER_CONTACTS',
      url: `/prisoner/${prisonerNumber}/contacts/list`,
    }

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/start`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/search/')
    const journey = Object.values(session.addContactJourneys)[0]
    expect(journey.returnPoint).toStrictEqual(expectedReturnPoint)
  })

  it('should set the return point to manage contacts if the journey parameters are specified', async () => {
    // Given
    const returnJourneyId = uuidv4()
    auditService.logPageView.mockResolvedValue(null)
    const expectedReturnPoint: ReturnPoint = {
      type: 'MANAGE_PRISONER_CONTACTS',
      url: `/prisoner/${prisonerNumber}/contacts/list/${returnJourneyId}`,
    }

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/create/start?returnJourneyType=MANAGE_PRISONER_CONTACTS&returnJourneyId=${returnJourneyId}`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/search/')
    const journey = Object.values(session.addContactJourneys)[0]
    expect(journey.returnPoint).toStrictEqual(expectedReturnPoint)
  })

  it('should not remove any existing add journeys in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        prisonerNumber,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        isContactConfirmed: undefined,
      },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/start`)
    const { location } = response.headers

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/search/')
    expect(Object.entries(session.addContactJourneys)).toHaveLength(2)
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(session.addContactJourneys[newId].id).toEqual(newId)
    expect(session.addContactJourneys[newId].lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        isContactConfirmed: undefined,
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        isContactConfirmed: undefined,
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        isContactConfirmed: undefined,
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        isContactConfirmed: undefined,
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
        isContactConfirmed: undefined,
      },
    ]

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/create/start`)
    const { location } = response.headers

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CREATE_CONTACT_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/contacts/search/')
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(Object.keys(session.addContactJourneys).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})
