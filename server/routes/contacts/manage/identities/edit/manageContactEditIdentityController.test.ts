import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  authorisingUser,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import { mockedReferenceData } from '../../../../testutils/stubReferenceData'
import TestData from '../../../../testutils/testData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { ContactDetails, ContactIdentityDetails } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'

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
  identities: [
    TestData.getContactIdentityDetails('DL', 'Driving licence', 'LAST-87736799M', 'UK', 1, true),
    TestData.getContactIdentityDetails('PASS', 'Passport number', '425362965', 'UK passport office', 2, true),
    TestData.getContactIdentityDetails('NINO', 'National insurance number', '06/614465M', 'UK', 3, true),
  ],
  createdBy: basicPrisonUser.username,
  createdTime: '2024-01-01',
}
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      referenceDataService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/:contactIdentityId/edit', () => {
  it('should render edit identity number page with navigation back to manage contact and all field populated', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/edit`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Update an identity document for the contact - Edit contact details - DPS')
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual(
      'Update an identity document for First Middle Last',
    )
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit identity documentation for a contact')
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/987654/relationship/456789/edit-contact-details',
    )
    expect($('[data-qa=continue-button]').first().text().trim()).toStrictEqual('Confirm and save')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('#identityType').val()).toStrictEqual('DL')
    expect($('#identityValue').val()).toStrictEqual('LAST-87736799M')
    expect($('#issuingAuthority').val()).toStrictEqual('UK')
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.getContact.mockResolvedValue(contact)

    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/edit`)
      .expect(expectedStatus)
  })

  it('should render edited answers instead of original if there is a validation error', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)
    const form = { identityValue: '425362965', identityType: 'PASS', issuingAuthority: 'UK' }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/edit`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('#identityValue').val()).toStrictEqual('425362965')
    expect($('#identityType').val()).toStrictEqual('PASS')
    expect($('#issuingAuthority').val()).toStrictEqual('UK')
  })

  it('should call the audit service for the page view', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/1/edit`,
    )

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.MANAGE_CONTACT_EDIT_IDENTITY_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '987654',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should raise an error if the contact identity number is missing', async () => {
    // Given
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/555/edit`,
    )

    // Then
    expect(response.status).toEqual(500)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/identity/:contactIdentityId/edit', () => {
  it('should edit identity number with issuing authority and pass to manage contact details page if there are no validation errors', async () => {
    contactsService.updateContactIdentity.mockResolvedValue({} as ContactIdentityDetails)
    contactsService.getContactName.mockResolvedValue(TestData.contactName({ middleNames: 'Middle Names' }))

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/999/edit`,
      )
      .type('form')
      .send({ identityType: 'MOB', identityValue: '123456789', issuingAuthority: '000' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/987654/relationship/456789')

    expect(contactsService.updateContactIdentity).toHaveBeenCalledWith(
      contactId,
      999,
      currentUser,
      expect.any(String),
      'MOB',
      '123456789',
      '000',
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the identity documentation for Jones Middle Names Mason.',
    )
  })

  it('should edit identity number without issuing authority and pass to manage contact details page if there are no validation errors', async () => {
    contactsService.updateContactIdentity.mockResolvedValue({} as ContactIdentityDetails)
    contactsService.getContactName.mockResolvedValue(TestData.contactName())

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/999/edit`,
      )
      .type('form')
      .send({ identityType: 'MOB', identityValue: '123456789', issuingAuthority: '' })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/987654/relationship/456789')

    expect(contactsService.updateContactIdentity).toHaveBeenCalledWith(
      contactId,
      999,
      currentUser,
      expect.any(String),
      'MOB',
      '123456789',
      undefined,
    )
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the identity documentation for Jones Mason.',
    )
  })

  it('should return to input page with details kept if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/999/edit`,
      )
      .type('form')
      .send({ identityType: '' })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/999/edit#`,
      )
    expect(contactsService.updateContactIdentity).not.toHaveBeenCalled()
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 302],
    [authorisingUser, 302],
  ])('POST should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    contactsService.updateContactIdentity.mockResolvedValue({} as ContactIdentityDetails)
    contactsService.getContactName.mockResolvedValue(TestData.contactName({ middleNames: 'Middle Names' }))

    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/identity/999/edit`,
      )
      .type('form')
      .send({ identityType: 'MOB', identityValue: '123456789', issuingAuthority: '000' })
      .expect(expectedStatus)
  })
})
