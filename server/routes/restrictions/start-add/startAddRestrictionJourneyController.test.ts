import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { Page } from '../../../services/auditService'
import AddRestrictionJourney = journeys.AddRestrictionJourney
import ContactDetails = contactsApiClientTypes.ContactDetails
import { MockedService } from '../../../testutils/mockedServices'
import TestData from '../../testutils/testData'

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
      prisonerSearchService,
    },
    userSupplier: () => user,
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
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/start?returnUrl=/foo`,
      )

      // Then
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_RESTRICTION_START_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      expect(response.status).toEqual(302)
      expect(response.headers['location']).toContain(
        `/prisoner/A1234BC/contacts/123/relationship/321/restriction/add/${restrictionClass}/enter-restriction/`,
      )
      expect(Object.entries(session.addRestrictionJourneys!)).toHaveLength(1)
      const journey = Object.values(session.addRestrictionJourneys!)[0]!
      expect(journey.returnPoint).toStrictEqual({ url: '/foo' })
    },
  )

  it('should not remove any existing add journeys in the session', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        returnPoint: { url: '/foo-bar' },
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
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/start?returnUrl=/foo`,
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
    contactsService.getContact.mockResolvedValue(contact)
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
        returnPoint: { url: '/foo-bar' },
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
        returnPoint: { url: '/foo-bar' },
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
        returnPoint: { url: '/foo-bar' },
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
        returnPoint: { url: '/foo-bar' },
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
        returnPoint: { url: '/foo-bar' },
      },
    ]

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/PRISONER_CONTACT/start?returnUrl=/foo`,
    )
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    const newId = location!.substring(location!.lastIndexOf('/') + 1)
    expect(Object.keys(session.addRestrictionJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})
