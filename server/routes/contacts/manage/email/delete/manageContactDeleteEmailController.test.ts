import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import AuditService, { Page } from '../../../../../services/auditService'
import ReferenceDataService from '../../../../../services/referenceDataService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../../services/prisonerSearchService'
import ContactService from '../../../../../services/contactsService'
import TestData from '../../../../testutils/testData'
import ContactDetails = contactsApiClientTypes.ContactDetails

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactService(null) as jest.Mocked<ContactService>

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
  emailAddresses: [
    TestData.getContactEmailDetails('first@example.com', 123),
    TestData.getContactEmailDetails('last@example.com', 77),
  ],
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
describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/delete', () => {
  it('should call the audit service for the page view', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/123/delete?returnUrl=/foo-bar`)
      .expect(200)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_DELETE_EMAIL_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render the email details', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/123/delete?returnUrl=/foo-bar`)
      .expect(200)

    // Then
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete this email address?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo-bar')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.email-value').text().trim()).toStrictEqual('first@example.com')
  })

  it('should raise an error if the contact email is missing', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/555/delete?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/email/:contactEmailId/delete', () => {
  it('should delete contact email and redirect back to manage contact', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .post(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/email/123/delete?returnUrl=/foo-bar`)
      .expect(302)
      .expect('Location', '/foo-bar')

    // Then
    expect(contactsService.deleteContactEmail).toHaveBeenCalledWith(contactId, 123, user)
  })
})
