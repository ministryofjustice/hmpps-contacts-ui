import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { ContactDetails } from '../../../../../@types/contactsApiClient'

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
  isStaff: false,
  interpreterRequired: false,
  addresses: [],
  phoneNumbers: [],
  emailAddresses: [],
  employments: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  identities: [
    TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', 'UK', 1, true),
    TestData.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2, true),
    TestData.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', 'UK', 3, true),
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/:contactIdentityId/delete', () => {
  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/delete?returnUrl=/foo-bar`,
      )
      .expect(200)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_DELETE_IDENTITY_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: '987654',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render the confirm delete page', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/delete?returnUrl=/foo-bar`,
      )
      .expect(200)

    // Then
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete an identity document for the contact? - Edit contact details - DPS',
    )
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete this identity document for First Middle Last?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-details',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.identity-number-value').text().trim()).toStrictEqual('LAST-87736799M')
    expect($('.issuing-authority-value').text().trim()).toStrictEqual('UK')
    expect($('.type-value').text().trim()).toStrictEqual('Driving licence')
  })

  it('should raise an error if the contact identity number is missing', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/555/delete?returnUrl=/foo-bar`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/:contactIdentityId/delete', () => {
  it('should delete contact and redirect back to manage contact', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/delete?returnUrl=/foo-bar`,
      )
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/987654/relationship/456789')

    // Then
    expect(contactsService.deleteContactIdentity).toHaveBeenCalledWith(contactId, 1, user, expect.any(String))
  })
})
