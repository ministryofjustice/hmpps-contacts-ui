import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { adminUserPermissions, adminUser, appWithAllRoutes, basicPrisonUser } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { AddressJourney } from '../../../../../@types/journeys'
import { ContactDetails } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/contactsService')
jest.mock('../../../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<AddressJourney>
let currentUser: HmppsUser
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 456789
const contact: ContactDetails = {
  id: contactId,
  isStaff: false,
  interpreterRequired: false,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  employments: [],
  identities: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: basicPrisonUser.username,
  createdTime: '2024-01-01',
}

beforeEach(() => {
  currentUser = adminUser
  preExistingJourneysToAddToSession = []
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.addressJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: AddressJourney) => {
          session.addressJourneys![journey.id] = journey
        })
      }
    },
  })

  mockPermissions(app, adminUserPermissions)

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/start', () => {
  it('should create the journey and redirect to select type page', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue({ ...contact, titleDescription: 'Mr' })

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/start`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADDRESS_START_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
        contactId: '123',
        prisonerContactId: '456789',
      },
    })

    expect(response.status).toEqual(302)

    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/select-type`,
    )
    expect(Object.entries(session.addressJourneys!)).toHaveLength(1)
    const journey = Object.values(session.addressJourneys!)[0]!
    expect(journey.addressType).toBeUndefined()
    expect(journey.addressLines).toBeUndefined()
    expect(journey.addressMetadata).toBeUndefined()
    expect(journey.contactNames).toStrictEqual({
      title: 'Mr',
      lastName: 'last',
      firstName: 'first',
      middleNames: 'middle',
    })
  })

  it('should not remove any existing address journeys in the session', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: randomUUID(),
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(Object.entries(session.addressJourneys!)).toHaveLength(2)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(session.addressJourneys![newId]!.id).toEqual(newId)
    expect(session.addressJourneys![newId]!.lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        prisonerNumber,
        contactId,
        isCheckingAnswers: false,
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(Object.keys(session.addressJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContactName.mockResolvedValue(contact)

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/start`)
      .expect(403)
  })
})
