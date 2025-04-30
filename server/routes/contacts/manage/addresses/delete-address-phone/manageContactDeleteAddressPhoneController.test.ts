import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, basicPrisonUser } from '../../../../testutils/appSetup'
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
const contactAddressId = 456654
const contact: ContactDetails = {
  id: contactId,
  isStaff: false,
  interpreterRequired: false,
  emailAddresses: [],
  employments: [],
  identities: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  phoneNumbers: [],
  addresses: [
    TestData.address({
      contactAddressId,
      phoneNumbers: [
        TestData.getAddressPhoneNumberDetails('HOME', 'Home', '01111 777777', 999, contactAddressId, 444),
        TestData.getAddressPhoneNumberDetails('MOB', 'Mobile', '07878 111111', 123, contactAddressId, 555, '123'),
      ],
    }),
  ],
  createdBy: basicPrisonUser.username,
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
    userSupplier: () => basicPrisonUser,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})
describe(`GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/phone/:contactPhoneId/delete`, () => {
  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/phone/999/delete`,
      )
      .expect(200)

    // Then
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.DELETE_ADDRESS_PHONE_PAGE, {
      who: basicPrisonUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '987654',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render the address phone details with ext number', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/phone/123/delete`,
      )
      .expect(200)

    // Then
    const $ = cheerio.load(response.text)

    expect($('title').text()).toStrictEqual(
      'Are you sure you want to delete a phone number for an address? - Edit contact methods - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete a phone number for this address?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Yes, delete phone number')
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(
      /<strong>Address:<\/strong><br>\n\s+?24<br>\s+?Acacia Avenue<br>\s+?Bunting<br>\s+?Sheffield<br>\s+?South Yorkshire<br>\s+?S2 3LK<br>\s+?England/,
    )

    expect($('.phone-number-value').text().trim()).toStrictEqual('07878 111111')
    expect($('.extension-value').text().trim()).toStrictEqual('123')
    expect($('.type-value').text().trim()).toStrictEqual('Mobile')
  })

  it('should render the address phone details without ext number', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/phone/999/delete`,
      )
      .expect(200)

    // Then
    const $ = cheerio.load(response.text)
    expect($('[data-qa=main-heading]').first().text().trim()).toStrictEqual(
      'Are you sure you want to delete a phone number for this address?',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('.phone-number-value').text().trim()).toStrictEqual('01111 777777')
    expect($('.extension-value').text().trim()).toStrictEqual('Not provided')
    expect($('.type-value').text().trim()).toStrictEqual('Home')
  })

  it('should raise an error if the contact address phone is missing', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/phone/555/delete`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe(`POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/phone/:contactPhoneId/delete`, () => {
  it('should delete address phone and redirect back to entry point', async () => {
    // Given
    contactsService.getContactName.mockResolvedValue(contact)

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/phone/123/delete`,
      )
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/987654/relationship/456789')

    // Then
    expect(contactsService.deleteContactAddressPhone).toHaveBeenCalledWith(
      contactId,
      contactAddressId,
      123,
      basicPrisonUser,
      expect.any(String),
    )
  })
})
