import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import { MockedService } from '../../../testutils/mockedServices'
import TestData from '../../testutils/testData'
import { AddRestrictionJourney } from '../../../@types/journeys'
import { ContactDetails } from '../../../@types/contactsApiClient'
import mockPermissions from '../../testutils/mockPermissions'
import Permission from '../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/auditService')
jest.mock('../../../services/contactsService')
jest.mock('../../../services/prisonerSearchService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()
const prisonerSearchService = MockedService.PrisonerSearchService()

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<AddRestrictionJourney>
const prisonerNumber = 'A1234BC'
const contactId = 123
const prisonerContactId = 321
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
const currentUser = authorisingUser

beforeEach(() => {
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
        session.addRestrictionJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: AddRestrictionJourney) => {
          session.addRestrictionJourneys![journey.id] = journey
        })
      }
    },
  })

  mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: true })

  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/:contactId/relationship/:prisonerContactId/restriction/add/:restrictionClass/start', () => {
  it.each([['PRISONER_CONTACT'], ['CONTACT_GLOBAL']])(
    'should create the journey and redirect to enter restriction page for restrictionClass %s',
    async restrictionClass => {
      // Given
      contactsService.getContactName.mockResolvedValue(contact)

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/start`,
      )

      // Then
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_RESTRICTION_START_PAGE, {
        who: authorisingUser.username,
        correlationId: expect.any(String),
        details: {
          contactId: '123',
          prisonerContactId: '321',
          prisonerNumber: 'A1234BC',
        },
      })
      expect(response.status).toEqual(302)
      expect(response.headers['location']).toContain(
        `/prisoner/A1234BC/contacts/123/relationship/321/restriction/add/${restrictionClass}/enter-restriction/`,
      )
      expect(Object.entries(session.addRestrictionJourneys!)).toHaveLength(1)
    },
  )

  it('should not remove any existing add journeys in the session', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: randomUUID(),
        lastTouched: new Date().toISOString(),
        prisonerNumber,
        contactId,
        prisonerContactId,
        restrictionClass: 'PRISONER_CONTACT',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(Object.entries(session.addRestrictionJourneys!)).toHaveLength(2)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(session.addRestrictionJourneys![newId]!.id).toEqual(newId)
    expect(session.addRestrictionJourneys![newId]!.lastTouched).toBeTruthy()
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
        prisonerContactId,
        restrictionClass: 'PRISONER_CONTACT',
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
        prisonerContactId,
        restrictionClass: 'PRISONER_CONTACT',
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
        prisonerContactId,
        restrictionClass: 'PRISONER_CONTACT',
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
        prisonerContactId,
        restrictionClass: 'PRISONER_CONTACT',
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
        prisonerContactId,
        restrictionClass: 'PRISONER_CONTACT',
        contactNames: {
          lastName: 'foo',
          firstName: 'bar',
        },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/start`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(Object.keys(session.addRestrictionJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })

  it('GET should block access without edit contact restrictions permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contact_restrictions]: false })

    contactsService.getContactName.mockResolvedValue(contact)
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/start`,
      )
      .expect(403)
  })
})
