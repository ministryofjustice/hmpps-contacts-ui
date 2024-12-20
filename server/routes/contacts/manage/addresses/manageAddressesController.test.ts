import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService from '../../../../services/auditService'
import ReferenceDataService from '../../../../services/referenceDataService'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactService from '../../../../services/contactsService'
import TestData from '../../../testutils/testData'
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactService(null) as jest.Mocked<ContactService>

let app: Express
const prisonerNumber = 'A1234BC'
const defaultAddress = TestData.address({})

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

describe('Addresses', () => {
  it('should show primary address', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact({
      addresses: [
        TestData.address({
          contactAddressId: 999,
          phoneNumbers: [
            {
              contactAddressPhoneId: 666,
              contactAddressId: 999,
              contactPhoneId: 333,
              contactId: 1,
              phoneType: 'HOME',
              phoneTypeDescription: 'Home',
              phoneNumber: '01111 777777',
              extNumber: '+0123',
              createdBy: 'JAMES',
              createdTime: '2024-10-04T15:35:23.101675v',
              updatedBy: null,
              updatedTime: null,
            } as ContactAddressPhoneDetails,
          ],
        }),
      ],
    })
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('.most-relevant-address-label').text().trim()).toStrictEqual('Primary')
    expect($('.confirm-address-value').text().trim()).toStrictEqual(
      '24, Acacia AvenueBuntingSheffieldSouth YorkshireS2 3LKEngland',
    )
    expect($('.address-999-specific-phone-value').text().trim()).toStrictEqual('Home: 01111 777777 (+0123)')
    expect($('[data-qa=change-address-specific-999-phone-666]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/address/999/phone/666/edit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/52/view-addresses',
    )
    expect($('[data-qa=delete-address-specific-999-phone-666]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/address/999/phone/666/delete?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/52/view-addresses',
    )
    expect($('[data-qa=confirm-start-date-value]').first().text().trim()).toStrictEqual('From January 2020')
  })

  it('should show no addresses when there are no addresses', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = []

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')
    expect($('.govuk-summary-card__title').text().trim()).toStrictEqual('')
    expect($('.confirm-address-value').text().trim()).toStrictEqual('')
  })

  it('should show all addresses when there are multiple addresses', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()

    function getAddress(id: number, flat: string = 'Flat 1') {
      const homeAddress = defaultAddress
      homeAddress.contactAddressId = id
      homeAddress.flat = flat
      return homeAddress
    }

    contact.addresses = [
      {
        ...getAddress(1, 'no 1'),
        addressType: 'HOME',
        addressTypeDescription: 'Home address',
        primaryAddress: true,
        mailFlag: false,
        comments: 'Home comment',
      },
      {
        ...getAddress(2, 'no 2'),
        addressType: 'WORK',
        addressTypeDescription: 'Work address',
        primaryAddress: false,
        mailFlag: true,
        comments: 'Work comment',
      },
      {
        ...getAddress(3, 'no 3'),
        addressType: 'BUS',
        addressTypeDescription: 'Business address',
        primaryAddress: false,
        mailFlag: false,
        comments: 'Business comment',
      },
    ]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')

    const cardTitles = $('.govuk-summary-card__title')
    expect(cardTitles.length).toStrictEqual(3)
    expect(cardTitles.eq(0).text().trim()).toStrictEqual('Home address')
    expect(cardTitles.eq(1).text().trim()).toStrictEqual('Work address')
    expect(cardTitles.eq(2).text().trim()).toStrictEqual('Business address')

    const addressLines = $('.confirm-address-value')
    expect(addressLines.eq(0).text()).toContain(
      'Flat no 1, 24, Acacia AvenueBuntingSheffieldSouth YorkshireS2 3LKEngland',
    )
    expect(addressLines.eq(1).text()).toContain(
      'Flat no 2, 24, Acacia AvenueBuntingSheffieldSouth YorkshireS2 3LKEngland',
    )
    expect(addressLines.eq(2).text()).toContain(
      'Flat no 3, 24, Acacia AvenueBuntingSheffieldSouth YorkshireS2 3LKEngland',
    )

    const mostRelevantLabel = $('.most-relevant-address-label')
    expect(mostRelevantLabel.length).toStrictEqual(2)
    expect(mostRelevantLabel.eq(0).text()).toContain('Primary')
    expect(mostRelevantLabel.eq(1).text()).toContain('Mail')

    expect($('.address-1-specific-phone-value').text().trim()).toContain('Home: 01111 777777 (+0123)')
    expect($('.address-2-specific-phone-value').text().trim()).toContain('Home: 01111 777777 (+0123)')
    expect($('.address-3-specific-phone-value').text().trim()).toContain('Home: 01111 777777 (+0123)')

    const comments = $('.confirm-comments-value')
    expect(comments.length).toStrictEqual(3)
    expect(comments.eq(0).text()).toContain('Home comment')
    expect(comments.eq(1).text()).toContain('Work comment')
    expect(comments.eq(2).text()).toContain('Business comment')

    const startDates = $('[data-qa=confirm-start-date-value]')
    expect(startDates.length).toStrictEqual(3)
    expect(startDates.eq(0).text()).toContain('From January 2020')
    expect(startDates.eq(1).text()).toContain('From January 2020')
    expect(startDates.eq(2).text()).toContain('From January 2020')
  })

  it('should show start date ', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = [{ ...defaultAddress, startDate: '2020-01-01' }]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')

    const startDates = $('[data-qa=confirm-start-date-value]')
    expect(startDates.length).toStrictEqual(1)
    expect(startDates.eq(0).text()).toContain('From January 2020')
  })

  it('should show end date ', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = [{ ...defaultAddress, endDate: '2022-02-02' }]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')

    const startDates = $('[data-qa=confirm-end-date-value]')
    expect(startDates.length).toStrictEqual(1)
    expect(startDates.eq(0).text()).toContain('To February 2022')
  })

  it('should show end date not provided', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = [{ ...defaultAddress, startDate: '', endDate: '' }]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')
    expect($('[data-qa="from-to-date-not-provided"]').text().trim()).toStrictEqual('Not provided')
  })

  it('should show no fixed address', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = [{ ...defaultAddress, noFixedAddress: true }]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')
    expect($('.confirm-address-value').text().trim()).toContain('No fixed address')
  })

  it('should show expired next to address card title', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = [{ ...defaultAddress, addressTypeDescription: 'Home address', endDate: '2024-01-01' }]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')
    expect($('.govuk-summary-card__title').text().trim()).toContain('Home address (expired)')
  })

  it('should show expired next to address card title if no address type', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses = [
      { ...defaultAddress, addressType: undefined, addressTypeDescription: undefined, endDate: '2024-01-01' },
    ]

    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(
      `/prisoner/G7941GL/contacts/manage/20000011/relationship/52/view-addresses?returnUrl=/foo-ba`,
    )

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('[data-qa="main-heading"]').text().trim()).toStrictEqual('Addresses for Jones Mason')
    expect($('.govuk-summary-card__title').text().trim()).toContain('Address (expired)')
  })
})
