import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import ContactsService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import ManageContactsJourney = journeys.ManageContactsJourney
import UpdateDateOfBirthJourney = journeys.UpdateDateOfBirthJourney
import GetContactResponse = contactsApiClientTypes.GetContactResponse

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

let app: Express
let session: Partial<SessionData>
let preExistingJourneysToAddToSession: Array<ManageContactsJourney>

beforeEach(() => {
  contactsService.getContact.mockResolvedValue(TestData.contact())
  app = appWithAllRoutes({
    services: { auditService, contactsService },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      if (preExistingJourneysToAddToSession) {
        session.updateDateOfBirthJourneys = {}
        preExistingJourneysToAddToSession.forEach((journey: UpdateDateOfBirthJourney) => {
          session.updateDateOfBirthJourneys[journey.id] = journey
        })
      }
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
  preExistingJourneysToAddToSession = []
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/update-dob/start', () => {
  it.each([
    [
      'DOB and estimated are both null',
      TestData.contact({ dateOfBirth: null, estimatedIsOverEighteen: null }),
      undefined,
    ],
    [
      'DOB set but no estimated',
      TestData.contact({ dateOfBirth: '2020-01-01', estimatedIsOverEighteen: null }),
      { isKnown: 'YES', day: 1, month: 1, year: 2020 },
    ],
    [
      'No DOB but estimated',
      TestData.contact({ dateOfBirth: null, estimatedIsOverEighteen: 'YES' }),
      { isKnown: 'NO', isOverEighteen: 'YES' },
    ],
  ])(
    'should create the journey and go to update dob, enter dob page %s',
    async (_: string, contact: GetContactResponse, expectedDob) => {
      auditService.logPageView.mockResolvedValue(null)
      contactsService.getContact.mockResolvedValue(contact)
      const response = await request(app).get('/prisoner/A1234BC/contacts/manage/987/update-dob/start')

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_START_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })
      const { location } = response.headers
      expect(response.status).toEqual(302)
      expect(location).toContain('/prisoner/A1234BC/contacts/manage/987/update-dob/enter-dob/')
      expect(Object.entries(session.updateDateOfBirthJourneys)).toHaveLength(1)

      // Get the latest journey ID just added
      const newId = location.substring(location.lastIndexOf('/') + 1)
      expect(session.updateDateOfBirthJourneys[newId].id).toEqual(newId)
      expect(session.updateDateOfBirthJourneys[newId].names).toStrictEqual({
        title: 'MR',
        lastName: 'Mason',
        firstName: 'Jones',
        middleNames: null,
      })
      expect(session.updateDateOfBirthJourneys[newId].dateOfBirth).toStrictEqual(expectedDob)
    },
  )

  it('validate a journey ID is added to the URL and the session', async () => {
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
      },
    ]

    const response = await request(app).get('/prisoner/A1234BC/contacts/manage/987/update-dob/start')

    // Get the redirect location from the response headers
    const { location } = response.headers

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/prisoner/A1234BC/contacts/manage/987/update-dob/enter-dob/')
    expect(Object.entries(session.updateDateOfBirthJourneys)).toHaveLength(2)

    // Get the most recent UUID added and check it is present in the journey map
    const newId = location.substring(location.lastIndexOf('/') + 1)
    expect(session.updateDateOfBirthJourneys[newId].id).toEqual(newId)
    expect(session.updateDateOfBirthJourneys[newId].lastTouched).toBeTruthy()
  })

  it('should not remove existing journeys when less than max exist', async () => {
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      {
        id: uuidv4(),
        lastTouched: new Date().toISOString(),
        search: {
          searchTerm: 'hello',
        },
      },
    ]

    const response = await request(app).get('/prisoner/A1234BC/contacts/manage/987/update-dob/start')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/prisoner/A1234BC/contacts/manage/987/update-dob/enter-dob/')
    expect(Object.entries(session.updateDateOfBirthJourneys)).toHaveLength(2)
  })

  it('should remove the oldest journey if there will be more than 5 journeys', async () => {
    auditService.logPageView.mockResolvedValue(null)
    preExistingJourneysToAddToSession = [
      { id: 'old', lastTouched: new Date(2024, 1, 1, 11, 30).toISOString() },
      { id: 'middle-aged', lastTouched: new Date(2024, 1, 1, 12, 30).toISOString() },
      { id: 'youngest', lastTouched: new Date(2024, 1, 1, 14, 30).toISOString() },
      { id: 'oldest', lastTouched: new Date(2024, 1, 1, 10, 30).toISOString() },
      { id: 'young', lastTouched: new Date(2024, 1, 1, 13, 30).toISOString() },
    ]

    const response = await request(app).get('/prisoner/A1234BC/contacts/manage/987/update-dob/start')
    const { location } = response.headers

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.UPDATE_CONTACT_DOB_START_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(location).toContain('/prisoner/A1234BC/contacts/manage/987/update-dob/enter-dob/')

    // Get the latest journey ID just added
    const newId = location.substring(location.lastIndexOf('/') + 1)

    // Check that the oldest journey has been replaced and still 5 are present
    expect(Object.keys(session.updateDateOfBirthJourneys).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
    expect(Object.entries(session.updateDateOfBirthJourneys)).toHaveLength(5)

    // Check that the newest ID is present in the journey list
    expect(session.updateDateOfBirthJourneys[newId].id).toEqual(newId)
    expect(session.updateDateOfBirthJourneys[newId].lastTouched).toBeTruthy()
  })
})
