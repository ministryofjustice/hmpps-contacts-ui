import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { components } from '../../../../@types/contactsApi'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')
jest.mock('../../../../services/referenceDataService')
jest.mock('../../../../services/restrictionsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const referenceDataService = MockedService.ReferenceDataService()
const restrictionsService = MockedService.RestrictionsService()

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

    describe('Addresses', () => {
      it.each([
        ['Primary and mail', true, true],
        ['Primary', true, false],
        ['Mail', false, true],
      ])(
        'should show relevant primary address flag as %s',
        async (flagLabel: string, primaryAddress: boolean, mailFlag: boolean) => {
          // Given
          prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
          const contact = TestData.contact()
          contact.addresses[0]!.primaryAddress = primaryAddress
          contact.addresses[0]!.mailFlag = mailFlag
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
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      const confirmAddressValueClass = '.confirm-address-value'
      expect($(confirmAddressValueClass).text().trim()).toStrictEqual(
        '24, Acacia AvenueBuntingSheffieldSouth YorkshireS2 3LKEngland',
      )
    })

    it('should show "No fixed address" for address flagged as NFA', async () => {
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contact = TestData.contact()
      contact.addresses[0]!.noFixedAddress = true
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
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue({ ...TestData.contact({}), addresses: undefined })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.addresses-not-provided').text().trim()).toStrictEqual('Not provided')
      expect($('[data-qa=add-new-addresses-link]').first().attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/manage/1/address/add/start?returnUrl=/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/view-addresses`,
      )
    })

    it('should not show comments when theres no comments', async () => {
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contact = TestData.contact()
      contact.addresses[0]!.comments = undefined
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

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (2)')
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
      expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('User One')
      expect($('.view-comment-1-value').text().trim()).toStrictEqual('Keep an eye')

      const globalRestrictionCardTitleText = $('.govuk-summary-card.restriction-2-card .govuk-summary-card__title')
        .text()
        .trim()

      expect(globalRestrictionCardTitleText).toStrictEqual('Keep under CCTV supervision')
      expect($('.view-start-date-2-value').text().trim()).toStrictEqual('2 January 2024')
      expect($('.view-expiry-date-2-value').text().trim()).toStrictEqual('1 August 2050')
      expect($('.view-entered-by-2-value').text().trim()).toStrictEqual('User One')
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

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (1)')

      const cardTitle = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title').text().trim()

      expect(cardTitle).toStrictEqual('Child Visitors to be Vetted (expired)')
      expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
      expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2024')
      expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('User One')
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

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (1)')

      const cardTitle = $('.govuk-summary-card.restriction-1-card .govuk-summary-card__title').text().trim()

      expect(cardTitle).toStrictEqual('Child Visitors to be Vetted (expired)')
      expect($('.view-start-date-1-value').text().trim()).toStrictEqual('1 January 2024')
      expect($('.view-expiry-date-1-value').text().trim()).toStrictEqual('1 August 2024')
      expect($('.view-entered-by-1-value').text().trim()).toStrictEqual('User One')
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

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (0)')
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
        '/prisoner/A1234BC/contacts/1/relationship/99/restriction/add/CONTACT_GLOBAL/start?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99%23restrictions',
      )

      expect($('[data-qa=add-prisoner-contact-restriction-button]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/1/relationship/99/restriction/add/PRISONER_CONTACT/start?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99%23restrictions',
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
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/22/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('[data-qa=manage-CONTACT_GLOBAL-restriction-link-1]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/22/relationship/99/restriction/update/CONTACT_GLOBAL/enter-restriction/1?returnUrl=/prisoner/A1234BC/contacts/manage/22/relationship/99%23restrictions',
      )

      expect($('[data-qa=manage-PRISONER_CONTACT-restriction-link-2]').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/22/relationship/99/restriction/update/PRISONER_CONTACT/enter-restriction/2?returnUrl=/prisoner/A1234BC/contacts/manage/22/relationship/99%23restrictions',
      )
    })

    it('should render professional information tab with no employment record', async () => {
      // Given
      contactsService.getContact.mockResolvedValue(TestData.contact())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('h1:contains("Professional information")').parent().parent().next().text()).toContain(
        'No employers recorded.',
      )
      expect($('a:contains("Edit employers")').attr('href')).toEqual(
        '/prisoner/A1234BC/contacts/manage/22/update-employments?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99',
      )
    })

    it('should render professional information tab with employment record', async () => {
      // Given
      const employment: components['schemas']['EmploymentDetails'] = {
        employmentId: 0,
        contactId: 0,
        employer: {
          organisationId: 0,
          organisationName: 'Big Corp',
          organisationActive: true,
          businessPhoneNumber: '60511',
          businessPhoneNumberExtension: '123',
          property: 'Some House',
          countryDescription: 'England',
        },
        isActive: false,
        createdBy: '',
        createdTime: '',
      }

      contactsService.getContact.mockResolvedValue(TestData.contact({ employments: [employment] }))

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('dt:contains("Employer name")').next().text()).toMatch(/Big Corp/)
      expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Some House(\s+)England/)
      expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/60511, ext\. 123/)
      expect($('dt:contains("Employment status")').next().text()).toMatch(/Inactive/)
      expect($('a:contains("Edit employers")').attr('href')).toEqual(
        '/prisoner/A1234BC/contacts/manage/22/update-employments?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99',
      )
    })

    it('should render professional information tab with employment record missing optional values', async () => {
      // Given
      const employment: components['schemas']['EmploymentDetails'] = {
        employmentId: 0,
        contactId: 0,
        employer: {
          organisationId: 0,
          organisationName: 'Small Corp',
          organisationActive: true,
        },
        isActive: true,
        createdBy: '',
        createdTime: '',
      }

      contactsService.getContact.mockResolvedValue(TestData.contact({ employments: [employment] }))

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('dt:contains("Employer name")').next().text()).toMatch(/Small Corp/)
      expect($('dt:contains("Employer’s primary address")').next().text()).toMatch(/Not provided/)
      expect($('dt:contains("Business phone number at primary address")').next().text()).toMatch(/Not provided/)
      expect($('dt:contains("Employment status")').next().text()).toMatch(/Active/)
    })
  })

  describe('Contact details tab', () => {
    beforeEach(() => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    })

    describe('Personal details card', () => {
      it('should render with all personal details', async () => {
        const contactDetails = {
          ...TestData.contact(),
          title: 'MR',
          titleDescription: 'Mr',
          firstName: 'First',
          middleNames: 'Middle Names',
          lastName: 'Last',
          dateOfBirth: '1982-06-15',
          gender: 'M',
          genderDescription: 'Male',
          isStaff: true,
        } as ContactDetails
        contactsService.getContact.mockResolvedValue(contactDetails)
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const personalInformationCard = $('h2:contains("Personal information")').parent().parent()
        expect(personalInformationCard).toHaveLength(1)
        expect($(personalInformationCard).find('dt:contains("Title")').next().text().trim()).toStrictEqual('Mr')
        expect($(personalInformationCard).find('dt:contains("Name")').next().text().trim()).toStrictEqual(
          'First Middle Names Last',
        )
        expect($(personalInformationCard).find('dt:contains("Date of birth")').next().text().trim()).toStrictEqual(
          '15 June 1982',
        )
        expect($(personalInformationCard).find('dt:contains("Gender")').next().text().trim()).toStrictEqual('Male')
        expect($(personalInformationCard).find('dt:contains("Staff member")').next().text().trim()).toStrictEqual('Yes')
      })

      it('should render without optional personal details', async () => {
        const contactDetails = {
          ...TestData.contact(),
          title: undefined,
          titleDescription: undefined,
          firstName: 'First',
          middleNames: undefined,
          lastName: 'Last',
          dateOfBirth: undefined,
          gender: undefined,
          genderDescription: undefined,
          isStaff: false,
        } as ContactDetails
        contactsService.getContact.mockResolvedValue(contactDetails)
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)
        const personalInformationCard = $('h2:contains("Personal information")').parent().parent()
        expect(personalInformationCard).toHaveLength(1)
        expect($(personalInformationCard).find('dt:contains("Title")').next().text().trim()).toStrictEqual(
          'Not provided',
        )
        expect($(personalInformationCard).find('dt:contains("Name")').next().text().trim()).toStrictEqual('First Last')
        expect($(personalInformationCard).find('dt:contains("Date of birth")').next().text().trim()).toStrictEqual(
          'Not provided',
        )
        expect($(personalInformationCard).find('dt:contains("Gender")').next().text().trim()).toStrictEqual(
          'Not provided',
        )
        expect($(personalInformationCard).find('dt:contains("Staff member")').next().text().trim()).toStrictEqual('No')
      })
    })

    describe('Relationship to prisoner card', () => {
      it('should render with all relationship details', async () => {
        const prisonerContactRelationshipDetails = {
          relationshipType: 'S',
          relationshipTypeDescription: 'Social',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          emergencyContact: true,
          nextOfKin: true,
          isRelationshipActive: true,
          isApprovedVisitor: true,
          comments: 'Some comments',
        } as PrisonerContactRelationshipDetails
        contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContactRelationshipDetails)

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const relationshipInformationCard = $('h2:contains("Relationship to prisoner John Smith")').parent().parent()
        expect(relationshipInformationCard).toHaveLength(1)
        expect(
          $(relationshipInformationCard).find('dt:contains("Relationship type")').next().text().trim(),
        ).toStrictEqual('Social')
        expect(
          $(relationshipInformationCard).find('dt:contains("Relationship to prisoner")').next().text().trim(),
        ).toStrictEqual('Friend')
        expect(
          $(relationshipInformationCard).find('dt:contains("Relationship status")').next().text().trim(),
        ).toStrictEqual('Active')
        expect(
          $(relationshipInformationCard).find('dt:contains("Emergency contact")').next().text().trim(),
        ).toStrictEqual('Yes')
        expect($(relationshipInformationCard).find('dt:contains("Next of kin")').next().text().trim()).toStrictEqual(
          'Yes',
        )
        expect(
          $(relationshipInformationCard).find('dt:contains("Approved for visits")').next().text().trim(),
        ).toStrictEqual('Yes')
        expect(
          $(relationshipInformationCard).find('dt:contains("Comments on the relationship")').next().text().trim(),
        ).toStrictEqual('Some comments')
      })

      it('should render without optional relationship details', async () => {
        const prisonerContactRelationshipDetails = {
          relationshipType: 'O',
          relationshipTypeDescription: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
          emergencyContact: false,
          nextOfKin: false,
          isRelationshipActive: false,
          isApprovedVisitor: false,
          comments: undefined,
        } as PrisonerContactRelationshipDetails
        contactsService.getPrisonerContactRelationship.mockResolvedValue(prisonerContactRelationshipDetails)

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const relationshipInformationCard = $('h2:contains("Relationship to prisoner John Smith")').parent().parent()
        expect(relationshipInformationCard).toHaveLength(1)
        expect(
          $(relationshipInformationCard).find('dt:contains("Relationship type")').next().text().trim(),
        ).toStrictEqual('Official')
        expect(
          $(relationshipInformationCard).find('dt:contains("Relationship to prisoner")').next().text().trim(),
        ).toStrictEqual('Doctor')
        expect(
          $(relationshipInformationCard).find('dt:contains("Relationship status")').next().text().trim(),
        ).toStrictEqual('Inactive')
        expect(
          $(relationshipInformationCard).find('dt:contains("Emergency contact")').next().text().trim(),
        ).toStrictEqual('No')
        expect($(relationshipInformationCard).find('dt:contains("Next of kin")').next().text().trim()).toStrictEqual(
          'No',
        )
        expect(
          $(relationshipInformationCard).find('dt:contains("Approved for visits")').next().text().trim(),
        ).toStrictEqual('No')
        expect(
          $(relationshipInformationCard).find('dt:contains("Comments on the relationship")').next().text().trim(),
        ).toStrictEqual('Not provided')
      })
    })

    describe('Identity documents card', () => {
      it('should render with all identity documents', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            identities: [
              TestData.getContactIdentityDetails('PASS', 'Passport number', '5555', undefined, 3),
              TestData.getContactIdentityDetails('PASS', 'Passport number', '6666', undefined, 2),
              TestData.getContactIdentityDetails('DL', 'Driving licence', '123456', 'DVLA', 1),
            ],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const identityDocCard = $('h2:contains("Identity documentation")').parent().parent()
        expect(identityDocCard).toHaveLength(1)
        expect($(identityDocCard).find('dt:contains("Driving licence")').next().text().trim()).toMatch(/123456/)
        expect($(identityDocCard).find('dt:contains("Driving licence")').next().text().trim()).toMatch(/Issued by DVLA/)
        expect($(identityDocCard).find('dt:contains("Passport number")').first().next().text().trim()).toStrictEqual(
          '5555',
        )
        expect($(identityDocCard).find('dt:contains("Passport number")').last().next().text().trim()).toStrictEqual(
          '6666',
        )
      })

      it('should render no identity documentation provided', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            identities: [],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const identityDocCard = $('h2:contains("Identity documentation")').parent().parent()
        expect(identityDocCard).toHaveLength(1)
        expect($(identityDocCard).text()).toMatch(/No identity documents provided./)
      })
    })

    describe('Additional information card', () => {
      it('should render with all additional information', async () => {
        const contactDetails = {
          ...TestData.contact(),
          languageCode: 'EN',
          languageDescription: 'English',
          interpreterRequired: true,
          domesticStatusCode: 'M',
          domesticStatusDescription: 'Married',
        }
        contactsService.getContact.mockResolvedValue(contactDetails)

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const additionalInfoCard = $('h2:contains("Additional information")').parent().parent()
        expect(additionalInfoCard).toHaveLength(1)
        expect(
          $(additionalInfoCard).find('dt:contains("Contact’s first language")').next().text().trim(),
        ).toStrictEqual('English')
        expect($(additionalInfoCard).find('dt:contains("Interpreter required")').next().text().trim()).toStrictEqual(
          'Yes',
        )
        expect(
          $(additionalInfoCard).find('dt:contains("Contact’s domestic status")').next().text().trim(),
        ).toStrictEqual('Married')
      })

      it('should render without optional additional information', async () => {
        const contactDetails = {
          ...TestData.contact(),
          languageCode: undefined,
          languageDescription: undefined,
          interpreterRequired: false,
          domesticStatusCode: undefined,
          domesticStatusDescription: undefined,
        }
        contactsService.getContact.mockResolvedValue(contactDetails)

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const additionalInfoCard = $('h2:contains("Additional information")').parent().parent()
        expect(additionalInfoCard).toHaveLength(1)
        expect(
          $(additionalInfoCard).find('dt:contains("Contact’s first language")').next().text().trim(),
        ).toStrictEqual('Not provided')
        expect($(additionalInfoCard).find('dt:contains("Interpreter required")').next().text().trim()).toStrictEqual(
          'No',
        )
        expect(
          $(additionalInfoCard).find('dt:contains("Contact’s domestic status")').next().text().trim(),
        ).toStrictEqual('Not provided')
      })
    })
  })

  describe('Contact methods tab', () => {
    beforeEach(() => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    })

    describe('Phone numbers summary card', () => {
      it('should render all phone numbers', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            phoneNumbers: [
              TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '4321', 1, undefined),
              TestData.getContactPhoneNumberDetails('BUS', 'Business', '5555', 2, undefined),
              TestData.getContactPhoneNumberDetails('BUS', 'Business', '1234', 3, '999'),
            ],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const phoneNumbersCard = $('h2:contains("Phone numbers")').first().parent().parent()
        expect(phoneNumbersCard).toHaveLength(1)
        expect($(phoneNumbersCard).find('dt:contains("Business")').first().next().text().trim()).toStrictEqual(
          '1234, ext. 999',
        )
        expect($(phoneNumbersCard).find('dt:contains("Business")').last().next().text().trim()).toStrictEqual('5555')
        expect($(phoneNumbersCard).find('dt:contains("Mobile")').next().text().trim()).toStrictEqual('4321')
      })

      it('should render no phone numbers provided', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            phoneNumbers: [],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const phoneNumbersCard = $('h2:contains("Phone numbers")').first().parent().parent()
        expect(phoneNumbersCard).toHaveLength(1)
        expect($(phoneNumbersCard).text()).toMatch(/No phone numbers provided./)
      })
    })

    describe('Emails summary card', () => {
      it('should render all emails', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            emailAddresses: [
              TestData.getContactEmailDetails('zzz@example.com', 1),
              TestData.getContactEmailDetails('test@example.com', 2),
            ],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const emailAddressesCard = $('h2:contains("Email addresses")').first().parent().parent()
        expect(emailAddressesCard).toHaveLength(1)
        expect($(emailAddressesCard).find('dd').first().text().trim()).toStrictEqual('test@example.com')
        expect($(emailAddressesCard).find('dd').last().text().trim()).toStrictEqual('zzz@example.com')
      })

      it('should render no email addresses provided', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            emailAddresses: [],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const emailAddressesCard = $('h2:contains("Email addresses")').first().parent().parent()
        expect(emailAddressesCard).toHaveLength(1)
        expect($(emailAddressesCard).text()).toMatch(/No email addresses provided./)
      })
    })

    describe('Addresses', () => {
      it.each([
        [
          true,
          true,
          'Business address',
          'Primary and postal address',
          'Business address',
          'Primary and postal address',
        ],
        [true, false, 'Business address', 'Primary address', 'Business address', 'Primary address'],
        [false, true, 'Business address', 'Postal address', 'Business address', 'Postal address'],
        [false, false, 'Business address', 'Business address', 'Business address', 'No'],
        [false, false, undefined, 'Address', 'Not provided', 'No'],
      ])(
        'should render an address with all details and the correct title (primary %s, mail %s, expired %s, type %s, expected title %s)',
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

          const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
          const $ = cheerio.load(response.text)

          const addressCard = $(`h2:contains("${expectedTitle}")`).first().parent().parent()
          expect(addressCard).toHaveLength(1)
          expect($(addressCard).find('dt:contains("Type")').next().text().trim()).toStrictEqual(expectedType)
          expect($(addressCard).find('dt:contains("Address")').next().html()?.trim()).toStrictEqual(
            'Flat 1a, Property, Street<br>Area<br>City<br>County<br>Postcode<br>England',
          )
          expect($(addressCard).find('dt:contains("Date")').next().text().trim()).toStrictEqual('From January 2021')
          expect($(addressCard).find('dt:contains("Primary or postal address")').next().text().trim()).toStrictEqual(
            expectedPrimaryOrPostal,
          )
          expect($(addressCard).find('dt:contains("Mobile phone")').next().text().trim()).toStrictEqual(
            '07878 111111, ext. 123',
          )
          expect($(addressCard).find('dt:contains("Business phone")').next().text().trim()).toStrictEqual('999')
          expect($(addressCard).find('dt:contains("Comments on this address")').next().text().trim()).toStrictEqual(
            'Some comments',
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
        'should render an expired address with all details and the correct title (primary %s, mail %s, expired %s, type %s, expected title %s)',
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

          const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
          const $ = cheerio.load(response.text)

          const addressCard = $(`h2:contains("${expectedTitle}")`).first().parent().parent()
          expect(addressCard).toHaveLength(1)
          expect($(addressCard).find('dt:contains("Type")').next().text().trim()).toStrictEqual(expectedType)
          expect($(addressCard).find('dt:contains("Address")').next().html()?.trim()).toStrictEqual(
            'Flat 1a, Property, Street<br>Area<br>City<br>County<br>Postcode<br>England',
          )
          expect($(addressCard).find('dt:contains("Date")').next().text().trim()).toStrictEqual(
            'From January 2021 to January 2022',
          )
          expect($(addressCard).find('dt:contains("Primary or postal address")').next().text().trim()).toStrictEqual(
            expectedPrimaryOrPostal,
          )
          expect($(addressCard).find('dt:contains("Mobile phone")').next().text().trim()).toStrictEqual(
            '07878 111111, ext. 123',
          )
          expect($(addressCard).find('dt:contains("Business phone")').next().text().trim()).toStrictEqual('999')
          expect($(addressCard).find('dt:contains("Comments on this address")').next().text().trim()).toStrictEqual(
            'Some comments',
          )
        },
      )

      it('should render an address without optional details', async () => {
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

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const addressCard = $(`h2:contains("Address")`).first().parent().parent()
        expect(addressCard).toHaveLength(1)
        expect($(addressCard).find('dt:contains("Type")').next().text().trim()).toStrictEqual('Not provided')
        expect($(addressCard).find('dt:contains("Address")').next().html()?.trim()).toStrictEqual(
          'No fixed address<br>England',
        )
        expect($(addressCard).find('dt:contains("Date")').next().text().trim()).toStrictEqual('Not provided')
        expect($(addressCard).find('dt:contains("Primary or postal address")').next().text().trim()).toStrictEqual('No')
        expect($(addressCard).find('dt:contains("Address phone numbers")').next().text().trim()).toStrictEqual(
          'Not provided',
        )
        expect($(addressCard).find('dt:contains("Comments on this address")').next().text().trim()).toStrictEqual(
          'Not provided',
        )
      })

      it('should render no addresses provided', async () => {
        contactsService.getContact.mockResolvedValue(
          TestData.contact({
            addresses: [],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        expect($('h2:contains("Addresses")').first().next().text()).toMatch(/No addresses provided./)
      })
    })
  })
})
