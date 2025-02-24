import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import ContactDetails = contactsApiClientTypes.ContactDetails
import { MockedService } from '../../../../../testutils/mockedServices'

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
const prisonerContactId = 456789
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
describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/:contactEmailId/delete', () => {
  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/123/delete`,
      )
      .expect(200)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_DELETE_EMAIL_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render the email details', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/123/delete`,
      )
      .expect(200)

    // Then
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete this email address for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789#contact-methods',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.email-value').text().trim()).toStrictEqual('first@example.com')
  })

  it('should raise an error if the contact email is missing', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/555/delete`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/email/:contactEmailId/delete', () => {
  it('should delete contact email and redirect back to manage contact', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/email/123/delete`,
      )
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/987654/relationship/456789')

    // Then
    expect(contactsService.deleteContactEmail).toHaveBeenCalledWith(contactId, 123, user)
  })
})
