import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>

let app: Express
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId', () => {
  it('should render contact details page', async () => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.updateContactById.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
  })
  describe('phone numbers', () => {
    it('should render phone numbers in reverse created date order', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          phoneNumbers: [
            TestData.getContactPhoneNumberDetails(
              'MOB',
              'Mobile phone',
              '07878 111111',
              1,
              '012',
              '2024-10-04T09:30:00.000000',
            ),
            TestData.getContactPhoneNumberDetails(
              'HOME',
              'Home phone',
              '01111 777777',
              2,
              '321',
              '2024-10-04T10:30:00.000000',
            ),
          ],
        }),
      )

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.phone-number-value-1').text().trim()).toStrictEqual('07878 111111')
      expect($('.phone-number-value-2').text().trim()).toStrictEqual('01111 777777')

      const phoneNumbers = $('.phone-number-value').toArray()
      expect(phoneNumbers).toHaveLength(2)
      expect($(phoneNumbers[0]).text().trim()).toStrictEqual('01111 777777')
      expect($(phoneNumbers[1]).text().trim()).toStrictEqual('07878 111111')
    })

    it('should render not provided if no phone numbers', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ phoneNumbers: [] }))

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.phone-numbers-not-provide-value').text().trim()).toStrictEqual('Not provided')
    })
  })

  describe('identity numbers', () => {
    it('should render identity numbers', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.confirm-DL-value').text().trim()).toStrictEqual('LAST-87736799M')
      expect($('.confirm-PASS-value').text().trim()).toStrictEqual('425362965Issuing authorithy - UK passport office')
      expect($('.confirm-NINO-value').text().trim()).toStrictEqual('06/614465M')
    })

    it('should render identity numbers edit link only for active identity types ', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contact = TestData.contact()
      contact.identities[0].identityTypeIsActive = false
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('a[data-qa="edit-identity-number-1"]').length).toStrictEqual(0) // Edit button is not preset
      expect($('a[data-qa="edit-identity-number-2"]').text().trim()).toStrictEqual(
        'Edit identity number (Identity numbers)',
      )
      expect($('a[data-qa="edit-identity-number-3"]').text().trim()).toStrictEqual(
        'Edit identity number (Identity numbers)',
      )
    })

    it('should render not provided if no identity numbers', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ identities: [] }))

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.identity-numbers-not-provide-value').text().trim()).toStrictEqual('Not provided')
    })
  })
})
