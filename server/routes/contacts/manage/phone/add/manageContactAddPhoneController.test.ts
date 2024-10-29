import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ContactService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import AddContactJourney = journeys.AddContactJourney
import GetContactResponse = contactsApiClientTypes.GetContactResponse

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactService(null) as jest.Mocked<ContactService>

let app: Express
let session: Partial<SessionData>
const journeyId: string = uuidv4()
const prisonerNumber = 'A1234BC'
const contactId = 987654
let existingJourney: AddContactJourney
const contact: GetContactResponse = {
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
  existingJourney = {
    id: journeyId,
    lastTouched: new Date().toISOString(),
    prisonerNumber,
    isCheckingAnswers: false,
    returnPoint: { type: 'MANAGE_PRISONER_CONTACTS', url: '/foo-bar' },
    mode: 'NEW',
  }
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
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
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:prisonerNumber/:contactId/phone/create', () => {
  it('should render create phone page with navigation back to manage contact', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is the phone number for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/987654')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/manage/987654')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_ADD_PHONE_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { type: 'MOB', phoneNumber: '123456789', extension: '000' }
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(`/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#type').val()).toStrictEqual('MOB')
    expect($('#phoneNumber').val()).toStrictEqual('123456789')
    expect($('#extension').val()).toStrictEqual('000')
  })
})

describe('POST /contacts/manage/:prisonerNumber/:contactId/phone/create', () => {
  it('should create phone with extension and pass to manage contact details page if there are no validation errors', async () => {
    await request(app)
      .post(`/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)
      .type('form')
      .send({ type: 'MOB', phoneNumber: '123456789', extension: '000' })
      .expect(302)
      .expect('Location', `/contacts/manage/${prisonerNumber}/${contactId}`)

    expect(contactsService.createContactPhone).toHaveBeenCalledWith(contactId, user, 'MOB', '123456789', '000')
  })

  it('should create phone without extension  and pass to manage contact details page if there are no validation errors', async () => {
    await request(app)
      .post(`/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)
      .type('form')
      .send({ type: 'MOB', phoneNumber: '123456789', extension: '' })
      .expect(302)
      .expect('Location', `/contacts/manage/${prisonerNumber}/${contactId}`)

    expect(contactsService.createContactPhone).toHaveBeenCalledWith(contactId, user, 'MOB', '123456789', undefined)
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)
      .type('form')
      .send({ type: '' })
      .expect(302)
      .expect('Location', `/contacts/manage/${prisonerNumber}/${contactId}/phone/create`)
    expect(contactsService.createContactPhone).not.toHaveBeenCalled()
  })
})