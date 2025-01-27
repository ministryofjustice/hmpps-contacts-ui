import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { components } from '../../../../../@types/contactsApi'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { MockedService } from '../../../../../testutils/mockedServices'

type CreateEmailRequest = components['schemas']['CreateEmailRequest']

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const referenceDataService = MockedService.ReferenceDataService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 987654
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
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => user,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/email/create', () => {
  it('should render create email page with navigation back to manage contact', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/create?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'What is the email address for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/create?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors', async () => {
    // Given
    const form = { emailAddress: 'name@' }
    contactsService.getContact.mockResolvedValue(contact)
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/create?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#emailAddress').val()).toStrictEqual('name@')
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/email/create', () => {
  it('should create email and pass to manage contact details page if there are no validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/create?returnUrl=/foo-bar`)
      .type('form')
      .send({ emailAddress: 'test@example.com' })
      .expect(302)
      .expect('Location', `/foo-bar`)

    const requestBody: CreateEmailRequest = {
      emailAddress: 'test@example.com',
      createdBy: user.name,
    }

    expect(contactsService.createContactEmail).toHaveBeenCalledWith(contactId, requestBody, user)
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/create?returnUrl=/foo-bar`)
      .type('form')
      .send({ emailAddress: '' })
      .expect(302)
      .expect('Location', `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/create?returnUrl=/foo-bar`)
    expect(contactsService.createContactEmail).not.toHaveBeenCalled()
  })
})
