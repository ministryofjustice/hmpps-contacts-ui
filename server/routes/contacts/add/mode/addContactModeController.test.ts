import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import ContactsService from '../../../../services/contactsService'
import AddContactJourney = journeys.AddContactJourney
import Contact = contactsApiClientTypes.Contact

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>

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
    returnPoint: { type: 'MANAGE_PRISONER_CONTACTS', url: '/foo-bar' },
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
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/mode/NEW/${journeyId}`)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_MODE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
  })

  it('should pass to the enter-name page if mode is NEW', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/add/mode/NEW/${journeyId}`)

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/create/enter-name/')
    expect(existingJourney.mode).toStrictEqual('NEW')
    expect(existingJourney.names).toBeUndefined()
    expect(existingJourney.dateOfBirth).toBeUndefined()
    expect(contactsService.getContact).not.toHaveBeenCalled()
  })

  it('should pass to the select relationship page if mode is EXISTING and the contact has a DOB', async () => {
    // Given
    const contact: Contact = {
      id: 123456,
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleName: 'first',
      dateOfBirth: '1980-12-10T00:00:00.000Z',
      createdBy: user.username,
      createdTime: '2024-01-01',
    }

    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/create/select-relationship/')
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
    expect(existingJourney.names).toStrictEqual({
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleName: 'first',
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
    const contact: Contact = {
      id: 123456,
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleName: 'first',
      dateOfBirth: undefined,
      estimatedIsOverEighteen: 'YES',
      createdBy: user.username,
      createdTime: '2024-01-01',
    }

    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`,
    )

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ADD_CONTACT_MODE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/create/select-relationship/')
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
    expect(existingJourney.names).toStrictEqual({
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleName: 'first',
    })
  })

  it('should pass to the select relationship page if mode is EXISTING and the contact has no DOB or estimated DOB', async () => {
    // Given
    const contact: Contact = {
      id: 123456,
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleName: 'first',
      dateOfBirth: undefined,
      estimatedIsOverEighteen: undefined,
      createdBy: user.username,
      createdTime: '2024-01-01',
    }

    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/mode/EXISTING/${journeyId}?contactId=123456`,
    )

    // Then
    expect(response.status).toEqual(302)
    expect(response.headers.location).toContain('/contacts/create/select-relationship/')
    expect(existingJourney.mode).toStrictEqual('EXISTING')
    expect(contactsService.getContact).toHaveBeenCalledWith(123456, user)
    expect(existingJourney.names).toStrictEqual({
      title: 'MR',
      lastName: 'last',
      firstName: 'middle',
      middleName: 'first',
    })
    expect(existingJourney.dateOfBirth).toStrictEqual({
      isKnown: 'NO',
      isOverEighteen: undefined,
    })
  })
})
