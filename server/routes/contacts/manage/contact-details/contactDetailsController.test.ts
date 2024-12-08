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

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId', () => {
  it('should render contact details page', async () => {
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.searchContact.mockResolvedValue(TestData.contact())
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    expect(response.status).toEqual(200)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
      who: user.username,
      correlationId: expect.any(String),
    })
    expect(contactsService.getContact).toHaveBeenCalledWith(1, user)
    expect(contactsService.getPrisonerContactRelationship).toHaveBeenCalledWith(99, user)
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
              null,
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
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.phone-number-value-1').text().trim()).toStrictEqual('07878 111111')
      expect($('.phone-number-value-2').text().trim()).toStrictEqual('01111 777777 (321)')

      const phoneNumbers = $('.phone-number-value').toArray()
      expect(phoneNumbers).toHaveLength(2)
      expect($(phoneNumbers[0]).text().trim()).toStrictEqual('01111 777777 (321)')
      expect($(phoneNumbers[1]).text().trim()).toStrictEqual('07878 111111')
    })

    it('should render not provided if no phone numbers', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ phoneNumbers: [] }))
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

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
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.confirm-DL-value').text().trim()).toStrictEqual('LAST-87736799M')
      expect($('.confirm-PASS-value').text().trim()).toStrictEqual('425362965Issuing authority - UK passport office')
      expect($('.confirm-NINO-value').text().trim()).toStrictEqual('06/614465M')
    })

    it('should render identity numbers edit link only for active identity types ', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contact = TestData.contact()
      contact.identities[0].identityTypeIsActive = false
      contactsService.getContact.mockResolvedValue(contact)
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

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
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.identity-numbers-not-provide-value').text().trim()).toStrictEqual('Not provided')
    })
  })

  describe('Email addresses', () => {
    it('should render email addresses', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.confirm-email-1-value').text().trim()).toStrictEqual('mr.last@example.com')
      expect($('.confirm-email-2-value').text().trim()).toStrictEqual('mr.first@example.com')
    })

    it('should render not provided if no email addresses', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ emailAddresses: [] }))
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.email-addresses-not-provide-value').text().trim()).toStrictEqual('Not provided')
    })

    it('should sort email addresses in alphabetic order', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contactDetails = TestData.contact()
      contactDetails.emailAddresses = [
        TestData.getContactEmailDetails('bravo@example.com', 1),
        TestData.getContactEmailDetails('alpha@example.com', 2),
      ]
      contactsService.getContact.mockResolvedValue(contactDetails)

      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      const emailAddresses = $('.confirm-email-value').toArray()
      expect(emailAddresses).toHaveLength(2)
      expect($(emailAddresses[0]).text().trim()).toStrictEqual('alpha@example.com')
      expect($(emailAddresses[1]).text().trim()).toStrictEqual('bravo@example.com')
    })
  })

  describe('Relationship', () => {
    it('should render all fields', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(
        TestData.prisonerContactRelationship({
          relationshipCode: 'FRI',
          relationshipDescription: 'Friend',
          emergencyContact: true,
          nextOfKin: false,
          isRelationshipActive: true,
          comments: 'Some comments',
        }),
      )

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.relationship-value').text().trim()).toStrictEqual('Friend')
      expect($('.emergency-contact-value').text().trim()).toStrictEqual('Yes')
      expect($('.next-of-kin-value').text().trim()).toStrictEqual('No')
      expect($('.relationship-active-value').text().trim()).toStrictEqual('Yes')
      expect($('.relationship-comments-value').text().trim()).toStrictEqual('Some comments')
    })

    it('should render not provided if no comments', async () => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(
        TestData.prisonerContactRelationship({
          relationshipCode: 'FRI',
          relationshipDescription: 'Friend',
          emergencyContact: false,
          nextOfKin: true,
          isRelationshipActive: false,
          comments: null,
        }),
      )

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.relationship-value').text().trim()).toStrictEqual('Friend')
      expect($('.emergency-contact-value').text().trim()).toStrictEqual('No')
      expect($('.next-of-kin-value').text().trim()).toStrictEqual('Yes')
      expect($('.relationship-active-value').text().trim()).toStrictEqual('No')
      expect($('.relationship-comments-value').text().trim()).toStrictEqual('Not provided')
    })

    describe('should render fields with correct information', () => {
      describe.each([
        {
          fieldName: 'an emergency contact',
          fieldKey: 'emergency-contact',
          fieldHiddenText: 'Change whether contact is an emergency contact (Relationship details)',
          mockResponse: { emergencyContact: true },
          expectedValue: 'Yes',
          expectedChangeLink: 'emergency-contact',
        },
        {
          fieldName: 'an emergency contact',
          fieldKey: 'emergency-contact',
          fieldHiddenText: 'Change whether contact is an emergency contact (Relationship details)',
          mockResponse: { emergencyContact: false },
          expectedValue: 'No',
          expectedChangeLink: 'emergency-contact',
        },
        {
          fieldName: 'next of kin',
          fieldKey: 'next-of-kin',
          fieldHiddenText: 'Change whether contact is next of kin (Relationship details)',
          mockResponse: { nextOfKin: true },
          expectedValue: 'Yes',
          expectedChangeLink: 'next-of-kin',
        },
        {
          fieldName: 'next of kin',
          fieldKey: 'next-of-kin',
          fieldHiddenText: 'Change whether contact is next of kin (Relationship details)',
          mockResponse: { nextOfKin: false },
          expectedValue: 'No',
          expectedChangeLink: 'next-of-kin',
        },
        {
          fieldName: 'additional information for a contact',
          fieldKey: 'relationship-comments',
          fieldHiddenText: 'Change additional information about the relationship  (Relationship details)',
          mockResponse: { comments: 'my comments' },
          expectedValue: 'my comments',
          expectedChangeLink: 'relationship-comments',
        },
      ])(
        'Relationship details - %s1',
        ({ fieldName, fieldKey, fieldHiddenText, mockResponse, expectedValue, expectedChangeLink }) => {
          it(`should render ${fieldName}`, async () => {
            setupMocks(mockResponse)

            const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/2`)

            expect(response.status).toBe(200)
            checkPageResponse(response.text, fieldKey, expectedValue, fieldHiddenText, expectedChangeLink)
          })
        },
      )

      interface MockResponse {
        relationshipDescription?: string
        emergencyContact?: boolean
        nextOfKin?: boolean
        isRelationshipActive?: boolean
        comments?: string
      }

      const setupMocks = (mockResponse: MockResponse) => {
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        contactsService.getContact.mockResolvedValue(TestData.contact())
        contactsService.getPrisonerContactRelationship.mockResolvedValue(mockResponse)
      }
      const checkPageResponse = (
        response: string,
        fieldKey: string,
        expectedValue: string,
        expectedHintText: string,
        expectedChangeLink: string,
      ) => {
        const $ = cheerio.load(response)
        const selectedAnswer = $(`.${fieldKey}-value`)
        expect(selectedAnswer.text().trim()).toBe(expectedValue)

        const changeLink = $(`[data-qa="change-${fieldKey}-link"]`)
        expect(changeLink.text().trim()).toBe(expectedHintText)
        expect(changeLink.attr('href')).toBe(
          `2/${expectedChangeLink}?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/2`,
        )
      }
    })
  })

  describe('Gender', () => {
    it.each([
      ['M', 'Male'],
      ['F', 'Female'],
      ['NK', 'Not Known / Not Recorded'],
      ['NS', 'Specified (Indeterminate)'],
    ])('should show gender if question was answered', async (gender: string, genderDescription: string) => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ gender, genderDescription }))
      referenceDataService.getReferenceDescriptionForCode.mockResolvedValue(genderDescription)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.manage-gender-value').text().trim()).toStrictEqual(genderDescription)
    })

    it('should show "not provided" for gender if question was not answered', async () => {
      // Given
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ gender: null, genderDescription: null }))
      referenceDataService.getReferenceDescriptionForCode.mockResolvedValue(null)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.manage-gender-value').text().trim()).toStrictEqual('Not provided')
    })
  })

  describe('Addresses', () => {
    it.each([
      ['Primary and mail', true, true],
      ['Primary', true, false],
      ['Mail', false, true],
    ])(
      'should show relevant primary address flag as %s',
      async (flagLabel: string, primaryAddress: boolean, mailFlag: boolean) => {
        // Given
        auditService.logPageView.mockResolvedValue(null)
        prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
        const contact = TestData.contact()
        contact.addresses[0].primaryAddress = primaryAddress
        contact.addresses[0].mailFlag = mailFlag
        contactsService.getContact.mockResolvedValue(contact)

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

        // Then
        const $ = cheerio.load(response.text)
        expect(response.status).toEqual(200)
        const addressCard = $('[data-qa=view-all-addresses]')
        expect(addressCard.first().text().trim()).toStrictEqual('View all addresses (Addresses)')
        expect(addressCard.first().attr('href')).toStrictEqual(
          '/prisoner/A1234BC/contacts/manage/1/relationship/99/view-addresses',
        )
        expect($('.most-relevant-address-label').text().trim()).toStrictEqual(flagLabel)
      },
    )
  })

  it('should show primary address details', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact())

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)

    const confirmAddressValueClass = '.confirm-address-value'
    expect($(confirmAddressValueClass).text().trim()).toStrictEqual(
      '24, Acacia AvenueBuntingSheffieldSouth YorkshireEngland',
    )
  })

  it('should show "No fixed address" for address flagged as NFA', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses[0].noFixedAddress = true
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('.confirm-address-value').text().trim()).toStrictEqual('No fixed address, Sheffield, England')
  })

  it('should show "not provided" for address if question was not answered', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    contactsService.getContact.mockResolvedValue(TestData.contact({ addresses: null }))

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('.addresses-not-provided').text().trim()).toStrictEqual('Not provided')
  })

  it('should not show comments when theres no comments', async () => {
    // Given
    auditService.logPageView.mockResolvedValue(null)
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
    const contact = TestData.contact()
    contact.addresses[0].comments = undefined
    contactsService.getContact.mockResolvedValue(contact)

    // When
    const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

    // Then
    const $ = cheerio.load(response.text)
    expect(response.status).toEqual(200)
    expect($('.confirm-comments-value').text().trim()).toStrictEqual('')
  })
})
