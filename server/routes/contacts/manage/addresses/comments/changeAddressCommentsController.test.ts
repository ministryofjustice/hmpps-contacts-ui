import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import {
  appWithAllRoutes,
  flashProvider,
  basicPrisonUser,
  adminUser,
  adminUserPermissions,
} from '../../../../testutils/appSetup'
import { Page } from '../../../../../services/auditService'
import TestData from '../../../../testutils/testData'
import { mockedGetReferenceDescriptionForCode, mockedReferenceData } from '../../../../testutils/stubReferenceData'
import { MockedService } from '../../../../../testutils/mockedServices'
import { FLASH_KEY__SUCCESS_BANNER } from '../../../../../middleware/setUpSuccessNotificationBanner'
import { ContactAddressDetails, ContactDetails } from '../../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../../interfaces/hmppsUser'
import mockPermissions from '../../../../testutils/mockPermissions'
import Permission from '../../../../../enumeration/permission'

jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../../../services/auditService')
jest.mock('../../../../../services/prisonerSearchService')
jest.mock('../../../../../services/referenceDataService')
jest.mock('../../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const referenceDataService = MockedService.ReferenceDataService()
const contactsService = MockedService.ContactsService()

let app: Express
let currentUser: HmppsUser
const prisonerNumber = 'A1234BC'
const contactId = 123456
const prisonerContactId = 456789
const contactAddressId = 888
const contact: ContactDetails = {
  id: contactId,
  isStaff: false,
  interpreterRequired: false,
  phoneNumbers: [],
  emailAddresses: [],
  employments: [],
  identities: [],
  lastName: 'last',
  firstName: 'first',
  middleNames: 'middle',
  dateOfBirth: '1980-12-10T00:00:00.000Z',
  createdBy: basicPrisonUser.username,
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
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      referenceDataService,
      contactsService,
    },
    userSupplier: () => currentUser,
  })

  mockPermissions(app, adminUserPermissions)

  contactsService.getContact.mockResolvedValue(contact)
  contactsService.getContactName.mockResolvedValue(contact)
  prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner({ prisonerNumber }))
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockImplementation(mockedGetReferenceDescriptionForCode)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/comments', () => {
  it('should render change address comments page', async () => {
    // Given
    contact.addresses[0]!.comments = 'text'

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
    )

    // Then
    expect(response.status).toEqual(200)

    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Change the comments about an address - Edit contact methods - DPS')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Edit contact methods')
    expect($('h1').first().text().trim()).toStrictEqual('Change the comments about this address')
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

    expect($('#comments').val()).toStrictEqual('text')

    expect(auditService.logPageView).toHaveBeenCalledWith(Page.ENTER_ADDRESS_COMMENTS_PAGE, {
      who: currentUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '123456',
        prisonerContactId: '456789',
        prisonerNumber: 'A1234BC',
      },
    })
  })

  it('should render previously entered details if validation errors even if values in the session', async () => {
    // Given
    const form = {
      comments: 'a'.repeat(300),
    }
    flashProvider.mockImplementation(key => (key === 'formResponses' ? [JSON.stringify(form)] : []))

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
    )

    // Then
    expect(response.status).toEqual(200)
    const $ = cheerio.load(response.text)
    expect($('#comments').val()).toStrictEqual(form.comments)
  })

  it('GET should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    contactsService.getContact.mockResolvedValue(contact)

    await request(app)
      .get(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
      )
      .expect(403)
  })
})

describe('POST /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId/address/:contactAddressId/comments', () => {
  it('should update the address comments and redirect if there are no validation errors', async () => {
    // Given
    contactsService.updateContactAddress.mockResolvedValue({ contactAddressId } as ContactAddressDetails)
    const comments = 'text'

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
      )
      .type('form')
      .send({ comments })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/123456/relationship/456789')

    // Then
    const expected = {
      contactId,
      contactAddressId,
      comments,
    }
    expect(contactsService.updateContactAddress).toHaveBeenCalledWith(expected, currentUser, expect.any(String))
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the contact methods for First Middle Last.',
    )
  })

  it('should update the address comments to null if the input is blank', async () => {
    // Given
    contactsService.updateContactAddress.mockResolvedValue({ contactAddressId } as ContactAddressDetails)
    const comments = ''

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
      )
      .type('form')
      .send({ comments })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/123456/relationship/456789')

    // Then
    const expected = {
      contactId,
      contactAddressId,
      comments: null,
    }
    expect(contactsService.updateContactAddress).toHaveBeenCalledWith(expected, currentUser, expect.any(String))
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the contact methods for First Middle Last.',
    )
  })

  it('should update the address comments and redirect if there are no validation errors', async () => {
    // Given
    contactsService.updateContactAddress.mockResolvedValue({ contactAddressId } as ContactAddressDetails)
    const comments = 'text'

    // When
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
      )
      .type('form')
      .send({ comments })
      .expect(302)
      .expect('Location', '/prisoner/A1234BC/contacts/manage/123456/relationship/456789')

    // Then
    const expected = {
      contactId,
      contactAddressId,
      comments,
    }
    expect(contactsService.updateContactAddress).toHaveBeenCalledWith(expected, currentUser, expect.any(String))
    expect(flashProvider).toHaveBeenCalledWith(
      FLASH_KEY__SUCCESS_BANNER,
      'You’ve updated the contact methods for First Middle Last.',
    )
  })

  it('should return to enter page if there are validation errors', async () => {
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
      )
      .type('form')
      .send({ comments: 'a'.repeat(300) })
      .expect(302)
      .expect(
        'Location',
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments#`,
      )
  })

  it('POST should block access without edit contacts permission', async () => {
    mockPermissions(app, { [Permission.read_contacts]: true, [Permission.edit_contacts]: false })

    const comments = 'text'
    await request(app)
      .post(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}/address/${contactAddressId}/comments`,
      )
      .type('form')
      .send({ comments })
      .expect(403)
  })
})
