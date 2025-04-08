import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import AddContactJourney = journeys.AddContactJourney
import ContactDetails = contactsApiClientTypes.ContactDetails
import { MockedService } from '../../../../testutils/mockedServices'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const contactsService = MockedService.ContactsService()

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
let existingJourney: AddContactJourney

beforeEach(() => {
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { url: '/foo-bar' },
  }

  app = appWithAllRoutes({
    services: {
      auditService,
      contactsService,
    },
    userSupplier: () => user,
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
      session.addContactJourneys = {}
      session.addContactJourneys[journeyId] = existingJourney
    },
  })
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
      who: user.username,
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
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      dateOfBirth: '1980-12-10T00:00:00.000Z',
      createdBy: user.username,
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
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
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
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      dateOfBirth: undefined,
      createdBy: user.username,
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
      who: user.username,
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
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
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
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      dateOfBirth: undefined,
      createdBy: user.username,
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
      who: user.username,
      correlationId: expect.any(String),
      details: {
        prisonerNumber: 'A1234BC',
      },
    })

    expect(response.headers['location']).toStrictEqual(
      `/prisoner/${prisonerNumber}/contacts/create/select-relationship-type/${journeyId}`,
    )
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
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
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleNames: 'first',
      dateOfBirth: '1982-01-01',
      deceasedDate: '2020-12-25',
      createdBy: user.username,
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
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
    expect(existingJourney.existingContact).toStrictEqual({
      deceasedDate: '2020-12-25',
    })
  })
})
