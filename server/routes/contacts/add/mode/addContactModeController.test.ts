import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { adminUserPermissions, adminUser, appWithAllRoutes } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import { MockedService } from '../../../../testutils/mockedServices'
import { AddContactJourney } from '../../../../@types/journeys'
import { ContactDetails } from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'
import mockPermissions from '../../../testutils/mockPermissions'
import Permission from '../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = randomUUID()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
    },
    userSupplier: () => currentUser,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })

  mockPermissions(app, adminUserPermissions)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/add/mode/:mode/:journeyId', () => {
  it('should audit', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/mode/NEW/${journeyId}`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_MODE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
    expect(response.status).toEqual(302)
  })

  it('should pass to the enter-name page if mode is NEW', async () => {
    // Given

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/mode/NEW/${journeyId}`)

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toContain('/contacts/create/enter-name/')
    expect(existingJourney.mode).toStrictEqual('NEW')
    expect(existingJourney.names).toBeUndefined()
    expect(existingJourney.dateOfBirth).toBeUndefined()
    expect(contactsService.getContact).not.toHaveBeenCalled()
  })

  it('should pass to the select relationship page if mode is EXISTING and the contact has a DOB', async () => {
    // Given
    const contact: ContactDetails = {
      id: 123456,
      titleCode: 'MR',
      titleDescription: 'MR',
      isStaff: false,
      interpreterRequired: false,
      addresses: [],
      phoneNumbers: [],
      emailAddresses: [],
      employments: [],
      identities: [],
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      dateOfBirth: '1980-12-10T00:00:00.000Z',
      createdBy: currentUser.username,
      createdTime: '2024-01-01',
    }
    existingJourney.contactId = 123456
    existingJourney.matchingContactId = 123456

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, currentUser)
    expect(existingJourney.names).toStrictEqual({
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
    })
    expect(existingJourney.dateOfBirth).toStrictEqual({
      isKnown: 'YES',
      year: 1980,
      month: 12,
      day: 10,
    })
  })

  it('should pass to the select relationship page if mode is EXISTING and the contact has no DOB', async () => {
    // Given
    const contact: ContactDetails = {
      id: 123456,
      titleCode: 'MR',
      titleDescription: 'MR',
      isStaff: false,
      interpreterRequired: false,
      addresses: [],
      phoneNumbers: [],
      emailAddresses: [],
      employments: [],
      identities: [],
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      createdBy: currentUser.username,
      createdTime: '2024-01-01',
    }
    existingJourney.contactId = 123456
    existingJourney.matchingContactId = 123456

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_MODE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, currentUser)
    expect(existingJourney.names).toStrictEqual({
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
    })
  })

  it('should pass to the select relationship page if mode is EXISTING and the contact has no DOB', async () => {
    // Given
    const contact: ContactDetails = {
      id: 123456,
      titleCode: 'MR',
      titleDescription: 'MR',
      isStaff: false,
      interpreterRequired: false,
      addresses: [],
      phoneNumbers: [],
      emailAddresses: [],
      employments: [],
      identities: [],
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      createdBy: currentUser.username,
      createdTime: '2024-01-01',
    }
    existingJourney.contactId = 123456
    existingJourney.matchingContactId = 123456

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}`)

    // Then
    expect(response.status).toEqual(302)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_MODE_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })

    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, currentUser)
    expect(existingJourney.names).toStrictEqual({
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
    })
    expect(existingJourney.dateOfBirth).toStrictEqual({
      isKnown: 'NO',
    })
  })

  it('should pass to the select relationship page if mode is EXISTING and the contact is deceased', async () => {
    // Given
    const contact: ContactDetails = {
      id: 123456,
      titleCode: 'MR',
      titleDescription: 'MR',
      isStaff: false,
      interpreterRequired: false,
      addresses: [],
      phoneNumbers: [],
      emailAddresses: [],
      employments: [],
      identities: [],
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      dateOfBirth: '1982-01-01',
      deceasedDate: '2020-12-25',
      createdBy: currentUser.username,
      createdTime: '2024-01-01',
    }
    existingJourney.contactId = 123456
    existingJourney.matchingContactId = 123456

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, currentUser)
    expect(existingJourney.existingContact).toStrictEqual({
      deceasedDate: '2020-12-25',
    })
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`)
      .expect(403)
  })
})
