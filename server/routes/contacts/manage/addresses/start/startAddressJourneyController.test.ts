import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import ContactsService from '../../../../../services/contactsService'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import ContactDetails = contactsApiClientTypes.ContactDetails
import AddressJourney = journeys.AddressJourney

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<AddressJourney>
const prisonerNumber = 'A1234BC'
const contactId = 123
const contact: ContactDetails = {
  id: contactId,
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: user.username,
  createdTime: '2024-01-01',
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
      if (preExistingJourneysToAddToSession) {
        session.addressJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: AddRestrictionJourney) => {
          session.addressJourneys[journey.id] = journey
        })
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/address/add/start', () => {
  it('should create the journey and redirect to select type page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/add/start?returnUrl=/foo`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADDRESS_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/select-type`,
    )
    expect(Object.entries(session.addressJourneys)).toHaveLength(1)
    const journey = Object.values(session.addressJourneys)[0]
    expect(journey.returnPoint).toStrictEqual({ url: '/foo' })
  })

  it('should not remove any existing address journeys in the session', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        returnPoint: { url: '/foo-bar' },
        prisonerNumber,
        contactId,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/add/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(Object.entries(session.addressJourneys)).toHaveLength(2)
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(session.addressJourneys[newId].id).toEqual(newId)
    expect(session.addressJourneys[newId].lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        prisonerNumber,
        contactId,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        prisonerNumber,
        contactId,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        prisonerNumber,
        contactId,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        prisonerNumber,
        contactId,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        prisonerNumber,
        contactId,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
        returnPoint: { url: '/foo-bar' },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/address/add/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(Object.keys(session.addressJourneys).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})
