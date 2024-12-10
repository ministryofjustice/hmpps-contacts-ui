import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import AuditService, { Page } from '../../../../services/auditService'
import PrisonerSearchService from '../../../../services/prisonerSearchService'
import ContactsService from '../../../../services/contactsService'
import ReferenceDataService from '../../../../services/referenceDataService'
import TestData from '../../../testutils/testData'
import RestrictionsService from '../../../../services/restrictionsService'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/restrictionsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const contactsService = new ContactsService(null) as jest.Mocked<ContactsService>
const referenceDataService = new ReferenceDataService(null) as jest.Mocked<ReferenceDataService>
const restrictionsService = new RestrictionsService(null) as jest.Mocked<RestrictionsService>

let app: Express
const prisonerNumber = 'A1234BC'

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
      restrictionsService,
    },
  })
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
  restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
    prisonerContactRestrictions: [],
    contactGlobalRestrictions: [],
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId', () => {
  describe('Contact Details', () => {
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
            fieldName: 'relationship active',
            fieldKey: 'relationship-active',
            fieldHiddenText: 'Change whether relationship is active (Relationship details)',
            mockResponse: { isRelationshipActive: true },
            expectedValue: 'Yes',
            expectedChangeLink: 'relationship-status',
          },
          {
            fieldName: 'relationship active',
            fieldKey: 'relationship-active',
            fieldHiddenText: 'Change whether relationship is active (Relationship details)',
            mockResponse: { isRelationshipActive: false },
            expectedValue: 'No',
            expectedChangeLink: 'relationship-status',
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

  describe('Restrictions', () => {
    beforeEach(() => {
      auditService.logPageView.mockResolvedValue(null)
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue(TestData.contact())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    })
    it('should render restrictions tab with global and prisoner-contact restrictions', async () => {
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails()],
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({
            contactRestrictionId: 2,
            startDate: '2024-01-02',
            createdTime: '2024-08-01T09:00:00.000000',
            restrictionType: 'CCTV',
            restrictionTypeDescription: 'Keep under CCTV supervision',
          }),
        ],
      })
      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      expect(response.status).toEqual(200)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
        who: user.username,
        correlationId: expect.any(String),
      })

      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(2)')
      expect($('[data-qa="manage-restriction-title"]').text().trim()).toStrictEqual('Restrictions')
      const prisonerContactCardTitleText = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title')
        .text()
        .trim()

      expect($('[data-qa="confirm-prisoner-contact-restriction-title"]').text()).toStrictEqual(
        'Prisoner-contact restrictions between prisoner John Smith and contact Jones Mason',
      )
      expect($('[data-qa="confirm-global-restriction-title"]').text()).toStrictEqual(
        'Global restrictions for contact Jones Mason',
      )

      expect(prisonerContactCardTitleText).toStrictEqual('Child Visitors to be Vetted')
      expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
      expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2050')
      expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('USER1')
      expect($('.view-comment-1-value').text().trim()).toStrictEqual('Keep an eye')

      const globalRestrictionCardTitleText = $('.govuk-summary-card.restriction-2-card .govuk-summary-card__title')
        .text()
        .trim()

      expect(globalRestrictionCardTitleText).toStrictEqual('Keep under CCTV supervision')
      expect($('.view-start-date-2-value').text().trim()).toStrictEqual('2 January 2024')
      expect($('.view-expiry-date-2-value').text().trim()).toStrictEqual('1 August 2050')
      expect($('.view-entered-by-2-value').text().trim()).toStrictEqual('USER1')
      expect($('.view-comment-2-value').text().trim()).toStrictEqual('Keep an eye')
    })

    it('should render global restrictions tab with expired restrictions', async () => {
      // Given
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({
            restrictionTypeDescription: 'Child Visitors to be Vetted',
            expiryDate: '2024-08-01',
          }),
        ],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(1)')

      const cardTitle = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title').text().trim()

      expect(cardTitle).toStrictEqual('Child Visitors to be Vetted (expired)')
      expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
      expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2024')
      expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('USER1')
      expect($('.view-comment-1-value').text().trim()).toStrictEqual('Keep an eye')
    })

    it('should render prisoner contact restrictions tab with expired restrictions', async () => {
      // Given
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            restrictionTypeDescription: 'Child Visitors to be Vetted',
            expiryDate: '2024-08-01',
          }),
        ],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(1)')

      const cardTitle = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title').text().trim()

      expect(cardTitle).toStrictEqual('Child Visitors to be Vetted (expired)')
      expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
      expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2024')
      expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('USER1')
      expect($('.view-comment-1-value').text().trim()).toStrictEqual('Keep an eye')
    })

    it('should render restrictions tab with no restrictions message', async () => {
      // Given
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [],
        prisonerContactRestrictions: [],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions(0)')
      expect($('.no_prisoner_contact_restriction_card__description').text().trim()).toStrictEqual(
        'No prisoner-contact restrictions recorded.',
      )
      expect($('.no_global_restrictions_card__description').text().trim()).toStrictEqual(
        'No global restrictions recorded.',
      )
    })

    it('should show not entered text for expiry date and comments when not available', async () => {
      // Given
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({ contactRestrictionId: 1, expiryDate: '', comments: '' }),
        ],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            prisonerContactRestrictionId: 2,
            expiryDate: '',
            comments: '',
          }),
        ],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('Not provided')
      expect($('.view-comment-1-value').text().trim()).toStrictEqual('Not provided')

      expect($('.view-expiry-date-2-value').text().trim()).toStrictEqual('Not provided')
      expect($('.view-comment-2-value').text().trim()).toStrictEqual('Not provided')
    })

    it('should show add global and prisoner contact restriction links', async () => {
      // Given
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({ contactRestrictionId: 1, expiryDate: '', comments: '' }),
        ],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            prisonerContactRestrictionId: 2,
            expiryDate: '',
            comments: '',
          }),
        ],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('[data-qa=add-global-restriction-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/1/relationship/99/restriction/add/CONTACT_GLOBAL/start',
      )

      expect($('[data-qa=add-prisoner-contact-restriction-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/1/relationship/99/restriction/add/PRISONER_CONTACT/start',
      )
    })

    it('should show manage restriction link', async () => {
      // Given
      restrictionsService.getPrisonerContactRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [
          TestData.getContactRestrictionDetails({ contactRestrictionId: 1, expiryDate: '', comments: '' }),
        ],
        prisonerContactRestrictions: [
          TestData.getPrisonerContactRestrictionDetails({
            prisonerContactRestrictionId: 2,
            expiryDate: '',
            comments: '',
          }),
        ],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('[data-qa=manage-CONTACT_GLOBAL-restriction-link-1]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/22/relationship/99/restriction/update/CONTACT_GLOBAL/enter-restriction/1?returnUrl=/prisoner/A1234BC/contacts/manage/22/relationship/99',
      )

      expect($('[data-qa=manage-PRISONER_CONTACT-restriction-link-2]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/22/relationship/99/restriction/update/PRISONER_CONTACT/enter-restriction/2?returnUrl=/prisoner/A1234BC/contacts/manage/22/relationship/99',
      )
    })
  })
})
