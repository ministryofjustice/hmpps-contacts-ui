import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import AddContactJourney = journeys.AddContactJourney

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
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
      prisonerSearchService,
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

describe('GET /prisoner/:prisonerNumber/contacts/add/EXISTING/confirmation/:journeyId?contactId=', () => {
  it('should render confirmation page', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contacts())

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_CONFIRMATION_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
})

describe('GET /prisoner/:prisonerNumber/contacts/add/EXISTING/confirmation/:journeyId?contactId=', () => {
  it('should pass validation when "Yes, this is the right person" is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}?contactId=1`)
      .type('form')
      .send({ isContactConfirmed: 'YES' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}?contactId=1`)

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual('YES')
  })

  it('should pass validation when "No, this is not the right person" is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}?contactId=1`)
      .type('form')
      .send({ isContactConfirmed: 'NO' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}?contactId=1`)

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual('NO')
  })

  it('should not pass validation when no option is selected', async () => {
    // Given
    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}?contactId=1`)
      .type('form')
      .send({ isContactConfirmed: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/add/EXISTING/confirmation/${journeyId}?contactId=1`)

    // Then
    expect(session.addContactJourneys[journeyId].isContactConfirmed).toStrictEqual(undefined)
  })
})
