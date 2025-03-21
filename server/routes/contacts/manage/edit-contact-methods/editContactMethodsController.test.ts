import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Cheerio, CheerioAPI } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { Page } from '../../../../services/auditService'
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId/edit-contact-methods', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
      TestData.prisoner({ firstName: 'Incarcerated', lastName: 'Individual' }),
    )
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
  })

  it('should audit page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
    )
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.EDIT_CONTACT_METHODS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(contactsService.getContact).toHaveBeenCalledWith(1, user)
  })

  it('should have correct navigation', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
    )
    const $ = cheerio.load(response.text)
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Edit contact methods for Jones Mason')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to contact record')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99#contact-methods',
    )
  })

  describe('Phone numbers summary card', () => {
    it('should render all phone numbers with change and delete links including the return anchor', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          phoneNumbers: [
            TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '4321', 1, undefined),
            TestData.getContactPhoneNumberDetails('BUS', 'Business', '5555', 2, undefined),
            TestData.getContactPhoneNumberDetails('BUS', 'Business', '1234', 3, '999'),
          ],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
      )
      const $ = cheerio.load(response.text)

      const addPhoneNumberLink = $('a:contains("Add phone number")')
      expect(addPhoneNumberLink).toHaveLength(1)
      expect(addPhoneNumberLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/create',
      )

      const phoneNumbersCard = $('h2:contains("Phone numbers")').first().parent().parent()
      expect(phoneNumbersCard).toHaveLength(1)
      expectChangeAndDeleteItem(
        $(phoneNumbersCard).find('dt:contains("Business")').first(),
        '1234, ext. 999',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/3/edit',
        'Change the information about this Business phone number (Phone numbers)',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/3/delete',
        'Delete the information about this Business phone number (Phone numbers)',
      )

      expectChangeAndDeleteItem(
        $(phoneNumbersCard).find('dt:contains("Business")').last(),
        '5555',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/2/edit',
        'Change the information about this Business phone number (Phone numbers)',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/2/delete',
        'Delete the information about this Business phone number (Phone numbers)',
      )

      expectChangeAndDeleteItem(
        $(phoneNumbersCard).find('dt:contains("Mobile")').first(),
        '4321',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/1/edit',
        'Change the information about this Mobile phone number (Phone numbers)',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/1/delete',
        'Delete the information about this Mobile phone number (Phone numbers)',
      )
    })

    it('should render no phone numbers provided with add link', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          phoneNumbers: [],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
      )
      const $ = cheerio.load(response.text)

      const phoneNumbersCard = $('h2:contains("Phone numbers")').first().parent().parent()
      expect(phoneNumbersCard).toHaveLength(1)
      expect($(phoneNumbersCard).text()).toMatch(/No phone numbers provided./)

      const addPhoneNumberLink = $('a:contains("Add phone number")')
      expect(addPhoneNumberLink).toHaveLength(1)
      expect(addPhoneNumberLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/phone/create',
      )
    })
  })

  describe('Emails summary card', () => {
    it('should render all emails with change and delete links that return to contact method tab', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          emailAddresses: [
            TestData.getContactEmailDetails('zzz@example.com', 1),
            TestData.getContactEmailDetails('test@example.com', 2),
          ],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
      )
      const $ = cheerio.load(response.text)

      const emailAddressesCard = $('h2:contains("Email addresses")').first().parent().parent()
      expect(emailAddressesCard).toHaveLength(1)
      expectChangeAndDeleteItem(
        $(emailAddressesCard).find('dt:contains("Email addresses")').first(),
        'test@example.com',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/email/2/edit',
        'Change this email address (Email addresses)',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/email/2/delete',
        'Delete this email address (Email addresses)',
      )
      expectChangeAndDeleteItem(
        $(emailAddressesCard).find('dt:contains("Email addresses")').parent().next().find('dt'),
        'zzz@example.com',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/email/1/edit',
        'Change this email address (Email addresses)',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/email/1/delete',
        'Delete this email address (Email addresses)',
      )

      const addEmailAddressLink = $('a:contains("Add email address")')
      expect(addEmailAddressLink).toHaveLength(1)
      expect(addEmailAddressLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/email/create',
      )
    })

    it('should render no email addresses provided with an email link', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          emailAddresses: [],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
      )
      const $ = cheerio.load(response.text)

      const emailAddressesCard = $('h2:contains("Email addresses")').first().parent().parent()
      expect(emailAddressesCard).toHaveLength(1)
      expect($(emailAddressesCard).text()).toMatch(/No email addresses provided./)

      const addEmailAddressLink = $('a:contains("Add email address")')
      expect(addEmailAddressLink).toHaveLength(1)
      expect(addEmailAddressLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/email/create',
      )
    })
  })

  describe('Addresses', () => {
    it.each([
      [true, true, 'Business address', 'Primary and postal address', 'Business address', 'Primary and postal address'],
      [true, false, 'Business address', 'Primary address', 'Business address', 'Primary address'],
      [false, true, 'Business address', 'Postal address', 'Business address', 'Postal address'],
      [false, false, 'Business address', 'Business address', 'Business address', 'No'],
      [false, false, undefined, 'Address', 'Not provided', 'No'],
    ])(
      'should render an address with all details and the correct title (primary %s, mail %s, type %s, expected title %s)',
      async (primary, mail, type, expectedTitle, expectedType, expectedPrimaryOrPostal) => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            addresses: [
              {
                contactAddressId: 1,
                contactId: 1,
                addressType: type,
                addressTypeDescription: type,
                primaryAddress: primary,
                flat: '1a',
                property: 'Property',
                street: 'Street',
                area: 'Area',
                cityCode: '123',
                cityDescription: 'City',
                countyCode: 'CNTY',
                countyDescription: 'County',
                postcode: 'Postcode',
                countryCode: 'ENG',
                countryDescription: 'England',
                verified: false,
                verifiedBy: undefined,
                verifiedTime: undefined,
                mailFlag: mail,
                startDate: '2021-01-01',
                endDate: undefined,
                noFixedAddress: false,
                phoneNumbers: [
                  TestData.getAddressPhoneNumberDetails('MOB', 'Mobile phone', '07878 111111', 123, 1, 555, '123'),
                  TestData.getAddressPhoneNumberDetails('BUS', 'Business phone', '999', 321, 1, 666, undefined),
                ],
                comments: 'Some comments',
                createdBy: 'James',
                createdTime: '2021-01-01',
              } as ContactAddressDetails,
            ],
          }),
        )

        const response = await request(app).get(
          `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
        )
        const $ = cheerio.load(response.text)

        expectAddAddressLink($)

        expect($(`span:contains("View previous addresses")`)).toHaveLength(0)
        expect(
          $('p:contains("To edit a previous address, you’ll first need to make that address active.")').text(),
        ).toBeFalsy()

        const addressCard = $(`h2:contains("${expectedTitle}")`).last().parent().parent()
        expect(addressCard).toHaveLength(1)
        expectSummaryListItem(
          addressCard,
          'Type',
          expectedType,
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/select-type',
          `Change the address type (${expectedTitle})`,
        )
        expectSummaryListItem(
          addressCard,
          'Address',
          /1a\s+?Property\s+?Street\s+?Area\s+?City\s+?County\s+?Postcode\s+?England/,
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/enter-address',
          `Change the address (${expectedTitle})`,
        )
        expectSummaryListItem(
          addressCard,
          'Date',
          'From January 2021',
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/dates',
          `Change the dates for the prisoner’s use of the address (${expectedTitle})`,
        )
        expectSummaryListItem(
          addressCard,
          'Primary or postal address',
          expectedPrimaryOrPostal,
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/primary-or-postal',
          `Change if this address is set as the primary or postal address for the contact (${expectedTitle})`,
        )
        expectChangeAndDeleteItem(
          $(addressCard).find('dt:contains("Mobile phone")'),
          '07878 111111, ext. 123',
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/phone/123/edit',
          `Change the information about the Mobile phone phone number for this address (${expectedTitle})`,
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/phone/123/delete',
          `Delete the information about the Mobile phone phone number for this address (${expectedTitle})`,
        )
        expectChangeAndDeleteItem(
          $(addressCard).find('dt:contains("Business phone")'),
          '999',
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/phone/321/edit',
          `Change the information about the Business phone phone number for this address (${expectedTitle})`,
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/phone/321/delete',
          `Delete the information about the Business phone phone number for this address (${expectedTitle})`,
        )
        expectSummaryListItem(
          addressCard,
          'Comments on this address',
          'Some comments',
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/comments',
          `Change the comments on this address (${expectedTitle})`,
        )
      },
    )

    it.each([
      [
        true,
        true,
        'Business address',
        'Previous primary and postal address',
        'Business address',
        'Primary and postal address',
      ],
      [true, false, 'Business address', 'Previous primary address', 'Business address', 'Primary address'],
      [false, true, 'Business address', 'Previous postal address', 'Business address', 'Postal address'],
      [false, false, 'Business address', 'Previous business address', 'Business address', 'No'],
      [false, false, undefined, 'Previous address', 'Not provided', 'No'],
    ])(
      'should render an expired address with all details and the correct title and change dates link (primary %s, mail %s, type %s, expected title %s)',
      async (primary, mail, type, expectedTitle, expectedType, expectedPrimaryOrPostal) => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            addresses: [
              {
                contactAddressId: 1,
                contactId: 1,
                addressType: type,
                addressTypeDescription: type,
                primaryAddress: primary,
                flat: '1a',
                property: 'Property',
                street: 'Street',
                area: 'Area',
                cityCode: '123',
                cityDescription: 'City',
                countyCode: 'CNTY',
                countyDescription: 'County',
                postcode: 'Postcode',
                countryCode: 'ENG',
                countryDescription: 'England',
                verified: false,
                verifiedBy: undefined,
                verifiedTime: undefined,
                mailFlag: mail,
                startDate: '2021-01-01',
                endDate: '2022-01-01',
                noFixedAddress: false,
                phoneNumbers: [
                  TestData.getAddressPhoneNumberDetails('MOB', 'Mobile phone', '07878 111111', 123, 1, 555, '123'),
                  TestData.getAddressPhoneNumberDetails('BUS', 'Business phone', '999', 321, 1, 666, undefined),
                ],
                comments: 'Some comments',
                createdBy: 'James',
                createdTime: '2021-01-01',
              } as ContactAddressDetails,
            ],
          }),
        )

        const response = await request(app).get(
          `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
        )
        const $ = cheerio.load(response.text)

        expectAddAddressLink($)
        expect(
          $('p:contains("To edit a previous address, you’ll first need to make that address active.")').text(),
        ).toBeTruthy()

        expect($(`span:contains("View previous addresses")`)).toHaveLength(1)

        const addressCard = $(`h2:contains("${expectedTitle}")`).last().parent().parent()
        expect(addressCard).toHaveLength(1)
        expectSummaryListItem(addressCard, 'Type', expectedType)
        expectSummaryListItem(
          addressCard,
          'Address',
          /1a\s+?Property\s+?Street\s+?Area\s+?City\s+?County\s+?Postcode\s+?England/,
        )
        expectSummaryListItem(
          addressCard,
          'Date',
          'From January 2021 to January 2022',
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/dates',
          `Change the dates for the prisoner’s use of the address (${expectedTitle})`,
        )
        expectSummaryListItem(addressCard, 'Primary or postal address', expectedPrimaryOrPostal)
        expectChangeAndDeleteItem($(addressCard).find('dt:contains("Mobile phone")'), '07878 111111, ext. 123')
        expectChangeAndDeleteItem($(addressCard).find('dt:contains("Business phone")'), '999')
        expectSummaryListItem(addressCard, 'Comments on this address', 'Some comments')
      },
    )

    it('should render an address without optional details and change links including to change address phone numbers', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          addresses: [
            {
              contactAddressId: 1,
              contactId: 1,
              addressType: undefined,
              addressTypeDescription: undefined,
              primaryAddress: false,
              flat: undefined,
              property: undefined,
              street: undefined,
              area: undefined,
              cityCode: undefined,
              cityDescription: undefined,
              countyCode: undefined,
              countyDescription: undefined,
              postcode: undefined,
              countryCode: 'ENG',
              countryDescription: 'England',
              verified: false,
              verifiedBy: undefined,
              verifiedTime: undefined,
              mailFlag: false,
              startDate: undefined,
              endDate: undefined,
              noFixedAddress: true,
              phoneNumbers: [],
              comments: undefined,
              createdBy: 'James',
              createdTime: '2021-01-01',
            } as ContactAddressDetails,
          ],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
      )
      const $ = cheerio.load(response.text)

      expectAddAddressLink($)

      const addressCard = $(`h2:contains("Address")`).last().parent().parent()
      expect(addressCard).toHaveLength(1)
      expectSummaryListItem(
        addressCard,
        'Type',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/select-type',
        `Change the address type (Address)`,
      )
      expectSummaryListItem(
        addressCard,
        'Address',
        'No fixed addressEngland',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/enter-address',
        `Change the address (Address)`,
      )
      expectSummaryListItem(
        addressCard,
        'Date',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/dates',
        `Change the dates for the prisoner’s use of the address (Address)`,
      )
      expectSummaryListItem(
        addressCard,
        'Primary or postal address',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/primary-or-postal',
        `Change if this address is set as the primary or postal address for the contact (Address)`,
      )
      expectSummaryListItem(
        addressCard,
        'Address phone numbers',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/phone/create',
        `Change the information about the phone number for this address (Address)`,
      )
      expectSummaryListItem(
        addressCard,
        'Comments on this address',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/address/1/comments',
        `Change the comments on this address (Address)`,
      )
    })

    it('should render no addresses provided with add address link', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          addresses: [],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods`,
      )
      const $ = cheerio.load(response.text)
      expect($('h2:contains("Addresses")').first().parent().parent().next().text()).toMatch(/No addresses provided./)
      expectAddAddressLink($)
    })
  })

  const expectSummaryListItem = (
    card: Cheerio<Element>,
    label: string,
    value: string | RegExp,
    changeLink?: string,
    changeLabel?: string,
  ) => {
    const summaryCardFirstColumn = card.find(`dt:contains("${label}")`).first()
    if (value instanceof RegExp) {
      expect(summaryCardFirstColumn.next().text().trim()).toMatch(value)
    } else {
      expect(summaryCardFirstColumn.next().text().trim()).toStrictEqual(value)
    }
    if (changeLink && changeLabel) {
      const link = summaryCardFirstColumn.next().next().find('a')
      expect(link.attr('href')).toStrictEqual(changeLink)
      expect(link.text().trim()).toStrictEqual(changeLabel)
    }
  }

  const expectChangeAndDeleteItem = (
    heading: Cheerio<Element>,
    value: string,
    changeLink?: string,
    changeLabel?: string,
    deleteLink?: string,
    deleteLabel?: string,
  ) => {
    expect(heading.next().text().trim()).toStrictEqual(value)
    const links = heading.next().next().find('a')
    if (changeLink && changeLabel) {
      expect(links.first().attr('href')).toStrictEqual(changeLink)
      expect(links.first().text().trim()).toStrictEqual(changeLabel)
    }
    if (deleteLink && deleteLabel) {
      expect(links.last().attr('href')).toStrictEqual(deleteLink)
      expect(links.last().text().trim()).toStrictEqual(deleteLabel)
    }
  }

  const expectAddAddressLink = ($: CheerioAPI) => {
    const addAddressLink = $(`h2:contains("Addresses")`).first().parent().next().find('a').first()
    expect(addAddressLink.text()).toStrictEqual('Add address')
    expect(addAddressLink.attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99/address/start',
    )
  }
})
