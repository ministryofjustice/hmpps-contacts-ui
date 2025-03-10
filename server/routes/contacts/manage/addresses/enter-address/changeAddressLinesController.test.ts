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
      cityCode: '25343',
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

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/enter-address', () => {
  it('should render change address lines page', async () => {
    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/enter-address`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('h1').first().text().trim()).toStrictEqual('Change this address for First Middle Last')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/123456/relationship/456789/edit-contact-methods',
    )
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/123456/relationship/456789',
    )
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')

    expect($('#noFixedAddressYes').attr('checked')).toBeTruthy()
    expect($('#flat').val()).toStrictEqual('1a')
    expect($('#premises').val()).toStrictEqual('My block')
    expect($('#street').val()).toStrictEqual('A street')
    expect($('#locality').val()).toStrictEqual('Downtown')
    expect($('#town').val()).toStrictEqual('25343')
    expect($('#county').val()).toStrictEqual('DEVON')
    expect($('#postcode').val()).toStrictEqual('PC1 D3')
    expect($('#country').val()).toStrictEqual('ENG')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDRESS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      flat: 'a'.repeat(200),
      premises: 'b',
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/enter-address`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#flat').val()).toStrictEqual(form.flat)
    expect($('#premises').val()).toStrictEqual(form.premises)

    expect($('#noFixedAddressYes').attr('checked')).toBeTruthy()
    expect($('#street').val()).toStrictEqual('A street')
    expect($('#locality').val()).toStrictEqual('Downtown')
    expect($('#town').val()).toStrictEqual('25343')
    expect($('#county').val()).toStrictEqual('DEVON')
    expect($('#postcode').val()).toStrictEqual('PC1 D3')
    expect($('#country').val()).toStrictEqual('ENG')
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/enter-address', () => {
  it('should update the address lines and redirect if there are no validation errors', async () => {
    // Given
    contactsService.updateContactAddress.mockResolvedValue({ contactAddressId })
    const noFixedAddress = false
    const flat = 'Flat 1'
    const street = 'Rocky Road'
    const country = 'ENG'

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/enter-address`,
      )
      .type('form')
      .send({ noFixedAddress, flat, street, country })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/123456/relationship/456789')

    // Then
    const expected = {
      contactId,
      contactAddressId,
      noFixedAddress,
      flat,
      street,
      country,
      county: null,
      locality: null,
      postcode: null,
      premises: null,
      town: null,
    }
    expect(contactsService.updateContactAddress).toHaveBeenCalledWith(expected, user)
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the contact methods for First Middle Last.',
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/enter-address`,
      )
      .type('form')
      .send({ flat: 'a'.repeat(300) })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/enter-address`,
      )
  })
})
