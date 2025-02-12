import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { Page } from '../../../../services/auditService'

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
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
    )
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.EDIT_CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(contactsService.getContact).toHaveBeenCalledWith(1, user)
    expect(contactsService.getPrisonerContactRelationship).toHaveBeenCalledWith(99, user)
  })

  it('should have correct navigation', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details?returnUrl=/foo`,
    )
    const $ = cheerio.load(response.text)
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Edit contact details for Jones Mason')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual('/foo')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual('/foo')
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
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods?returnUrl=/foo&returnAnchor=bar`,
      )
      const $ = cheerio.load(response.text)

      const addPhoneNumberLink = $('a:contains("Add phone number")')
      expect(addPhoneNumberLink).toHaveLength(1)
      expect(addPhoneNumberLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/phone/create?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
      )

      const phoneNumbersCard = $('h2:contains("Phone numbers")').first().parent().parent()
      expect(phoneNumbersCard).toHaveLength(1)
      expectSummaryListItem(
        $(phoneNumbersCard).find('dt:contains("Business")').first(),
        '1234, ext. 999',
        '/prisoner/A1234BC/contacts/manage/22/phone/3/edit?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Change the information about this Business phone number (Phone numbers)',
        '/prisoner/A1234BC/contacts/manage/22/phone/3/delete?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Delete the information about this Business phone number (Phone numbers)',
      )

      expectSummaryListItem(
        $(phoneNumbersCard).find('dt:contains("Business")').last(),
        '5555',
        '/prisoner/A1234BC/contacts/manage/22/phone/2/edit?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Change the information about this Business phone number (Phone numbers)',
        '/prisoner/A1234BC/contacts/manage/22/phone/2/delete?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Delete the information about this Business phone number (Phone numbers)',
      )

      expectSummaryListItem(
        $(phoneNumbersCard).find('dt:contains("Mobile")').first(),
        '4321',
        '/prisoner/A1234BC/contacts/manage/22/phone/1/edit?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Change the information about this Mobile phone number (Phone numbers)',
        '/prisoner/A1234BC/contacts/manage/22/phone/1/delete?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
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
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods?returnUrl=/foo&returnAnchor=bar`,
      )
      const $ = cheerio.load(response.text)

      const phoneNumbersCard = $('h2:contains("Phone numbers")').first().parent().parent()
      expect(phoneNumbersCard).toHaveLength(1)
      expect($(phoneNumbersCard).text()).toMatch(/No phone numbers provided./)

      const addPhoneNumberLink = $('a:contains("Add phone number")')
      expect(addPhoneNumberLink).toHaveLength(1)
      expect(addPhoneNumberLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/phone/create?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
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
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods?returnUrl=/foo&returnAnchor=bar`,
      )
      const $ = cheerio.load(response.text)

      const emailAddressesCard = $('h2:contains("Email addresses")').first().parent().parent()
      expect(emailAddressesCard).toHaveLength(1)
      expectSummaryListItem(
        $(emailAddressesCard).find('dt:contains("Email addresses")').first(),
        'test@example.com',
        '/prisoner/A1234BC/contacts/manage/22/email/2/edit?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Change this email address (Email addresses)',
        '/prisoner/A1234BC/contacts/manage/22/email/2/delete?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Delete this email address (Email addresses)',
      )
      expectSummaryListItem(
        $(emailAddressesCard).find('dt:contains("Email addresses")').parent().next().find('dt'),
        'zzz@example.com',
        '/prisoner/A1234BC/contacts/manage/22/email/1/edit?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Change this email address (Email addresses)',
        '/prisoner/A1234BC/contacts/manage/22/email/1/delete?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
        'Delete this email address (Email addresses)',
      )

      const addEmailAddressLink = $('a:contains("Add email address")')
      expect(addEmailAddressLink).toHaveLength(1)
      expect(addEmailAddressLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/email/create?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
      )
    })

    it('should render no email addresses provided with an email link', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          emailAddresses: [],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-methods?returnUrl=/foo&returnAnchor=bar`,
      )
      const $ = cheerio.load(response.text)

      const emailAddressesCard = $('h2:contains("Email addresses")').first().parent().parent()
      expect(emailAddressesCard).toHaveLength(1)
      expect($(emailAddressesCard).text()).toMatch(/No email addresses provided./)

      const addEmailAddressLink = $('a:contains("Add email address")')
      expect(addEmailAddressLink).toHaveLength(1)
      expect(addEmailAddressLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/email/create?returnUrl=%2Fprisoner%2FA1234BC%2Fcontacts%2Fmanage%2F1%2Frelationship%2F99%2Fedit-contact-methods%3FreturnUrl%3D%2Ffoo%26returnAnchor%3Dbar',
      )
    })
  })

  const expectSummaryListItem = (
    heading: Cheerio<Element>,
    value: string,
    changeLink: string,
    changeLabel: string,
    deleteLink: string,
    deleteLabel: string,
  ) => {
    expect(heading.next().text().trim()).toStrictEqual(value)
    const links = heading.next().next().find('a')
    expect(links.first().attr('href')).toStrictEqual(changeLink)
    expect(links.first().text().trim()).toStrictEqual(changeLabel)
    expect(links.last().attr('href')).toStrictEqual(deleteLink)
    expect(links.last().text().trim()).toStrictEqual(deleteLabel)
  }
})
