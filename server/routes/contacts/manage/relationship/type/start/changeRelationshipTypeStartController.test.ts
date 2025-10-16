import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { adminUserPermissions, adminUser, appWithAllRoutes, basicPrisonUser } from '../../../../../testutils/appSetup'
import { Page } from '../../../../../../services/auditService'
import TestData from '../../../../../testutils/testData'
import { MockedService } from '../../../../../../testutils/mockedServices'
import { ContactDetails, PrisonerContactRelationshipDetails } from '../../../../../../@types/contactsApiClient'
import { ChangeRelationshipTypeJourney } from '../../../../../../@types/journeys'
import { HmppsUser } from '../../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../../testutils/mockPermissions'
import Permission from '../../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../../services/auditService')
jest.mock('../../../../../../services/contactsService')
jest.mock('../../../../../../services/prisonerSearchService')
jest.mock('../../../../../../services/alertsService')

const alertsService = MockedService.AlertsService()
const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<ChangeRelationshipTypeJourney>
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
const prisonerContact: PrisonerContactRelationshipDetails = TestData.prisonerContactRelationship({
  prisonerContactId,
  relationshipTypeCode: 'S',
  relationshipToPrisonerCode: 'MOT',
})
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  preExistingJourneysToAddToSession = []
  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
      prisonerSearchService,
      alertsService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.changeRelationshipTypeJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: ChangeRelationshipTypeJourney) => {
          session.changeRelationshipTypeJourneys![journey.id] = journey
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/edit-relationship-type/:mode/start', () => {
  it.each([
    [
      'all',
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/select-new-relationship-type`,
    ],
    [
      'relationship-to-prisoner',
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/select-new-relationship-to-prisoner`,
    ],
  ])(
    'should create the journey and redirect to correct page with details populated in session for mode (%s)',
    async (mode, expectedUrl) => {
      // Given
      contactsService.getContact.mockResolvedValue(contact)
      contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContact)

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/${mode}/start`,
      )

      // Then
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CHANGE_RELATIONSHIP_TYPE_START_PAGE, {
        who: currentUser.username,
        correlationId: expect.any(String),
        details: {
          contactId: '123',
          prisonerContactId: '456789',
          prisonerNumber: 'A1234BC',
        },
      })
      expect(response.status).toEqual(302)
      expect(response.headers['location']).toContain(expectedUrl)
      expect(Object.entries(session.changeRelationshipTypeJourneys!)).toHaveLength(1)
      const journey = Object.values(session.changeRelationshipTypeJourneys!)[0]!
      expect(journey.relationshipType).toStrictEqual('S')
      expect(journey.relationshipToPrisoner).toStrictEqual('MOT')
      expect(journey.names).toStrictEqual({
        title: undefined,
        lastName: 'last',
        firstName: 'first',
        middleNames: 'middle',
      })
    },
  )

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(contact)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContact)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/all/start`,
      )
      .expect(403)
  })

  it('should not remove any existing address journeys in the session', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContact)

    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        mode: 'all',
        prisonerNumber,
        contactId,
        prisonerContactId,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/all/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(Object.entries(session.changeRelationshipTypeJourneys!)).toHaveLength(2)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(session.changeRelationshipTypeJourneys![newId]!.id).toEqual(newId)
    expect(session.changeRelationshipTypeJourneys![newId]!.lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContact)

    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        mode: 'all',
        prisonerNumber,
        contactId,
        prisonerContactId,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        mode: 'relationship-to-prisoner',
        prisonerNumber,
        contactId,
        prisonerContactId,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        mode: 'all',
        prisonerNumber,
        contactId,
        prisonerContactId,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        mode: 'all',
        prisonerNumber,
        contactId,
        prisonerContactId,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        mode: 'all',
        prisonerNumber,
        contactId,
        prisonerContactId,
        names: {
          lastName: 'foo',
          firstName: 'bar',
        },
        relationshipType: 'S',
        relationshipToPrisoner: 'MOT',
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/edit-relationship-type/all/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(Object.keys(session.changeRelationshipTypeJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})
