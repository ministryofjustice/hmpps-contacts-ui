import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, flashProvider, user } from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import ContactDetails = contactsApiClientTypes.ContactDetails

jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
const contactId = 123456
const prisonerContactId = 456789
const contactAddressId = 888
const contact: ContactDetails = {
  id: contactId,
  title: '',
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: user.username,
  createdTime: '2024-01-01',
  addresses: [
    TestData.address({
      contactAddressId,
      noFixedAddress: true,
      flat: '1a',
      property: 'My block',
      street: 'A street',
      area: 'Downtown',
      cityCode: '1234',
      cityDescription: 'Exeter',
      countyCode: 'DEVON',
      countyDescription: 'Devon',
      postcode: 'PC1 D3',
      countryCode: 'ENG',
      countryDescription: 'England',
      startDate: '2010-09-01',
      endDate: '2025-04-01',
      primaryAddress: true,
      mailFlag: true,
      comments: 'My comments will be super useful',
    }),
  ],
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
      contactsService,
    },
    userSupplier: () => user,
  })
  contactsService.getContact.mockResolvedValue(contact)
  contactsService.getContactName.mockResolvedValue(contact)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/primary-or-postal', () => {
  it('should render change address flags page', async () => {
    // Given
    contact.addresses[0].primaryAddress = false
    contact.addresses[0].mailFlag = false

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/primary-or-postal`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual(
      'Change if an address is the primary or postal address for the contact - Edit contact methods - DPS',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('h1').first().text().trim()).toStrictEqual(
      'Change if this is the primary or postal address for First Middle Last',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/123456/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/123456/relationship/456789',
    )
    expect($('[data-qa=address-reference]').first().html()!.trim()).toMatch(
      /<strong>Address:<\/strong><br>\n\s+?1a<br>\s+?My block<br>\s+?A street<br>\s+?Downtown<br>\s+?Exeter<br>\s+?Devon<br>\s+?PC1 D3<br>\s+?England/,
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
    expect(
      $(
        `p:contains("Setting this address as the primary or postal address for First Middle Last will remove these flags from any other addresses previously flagged.")`,
      ).text(),
    ).toBeTruthy()

    expect($('input[type=radio]:checked').val()).toEqual('NONE')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.SELECT_ADDRESS_FLAGS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123456',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/primary-or-postal', () => {
  it('should update the address flags and redirect if there are no validation errors', async () => {
    // Given
    contactsService.updateContactAddress.mockResolvedValue({ contactAddressId })
    const isPrimaryOrPostal = 'M'

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/primary-or-postal`,
      )
      .type('form')
      .send({ isPrimaryOrPostal })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/123456/relationship/456789')

    // Then
    const expected = {
      contactId,
      contactAddressId,
      primaryAddress: false,
      mailAddress: true,
    }
    expect(contactsService.updateContactAddress).toHaveBeenCalledWith(expected, user, expect.any(String))
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the contact methods for First Middle Last.',
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/primary-or-postal`,
      )
      .type('form')
      .send({ isPrimaryOrPostal: undefined })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/primary-or-postal`,
      )
  })
})
