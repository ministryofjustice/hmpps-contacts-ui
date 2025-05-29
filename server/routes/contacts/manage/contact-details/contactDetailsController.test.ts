import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import { Page } from '../../../../services/auditService'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { mockedReferenceData } from '../../../testutils/stubReferenceData'
import {
  ContactAddressDetails,
  ContactDetails,
  EmploymentDetails,
  LinkedPrisonerDetails,
  PrisonerContactRelationshipDetails,
} from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

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
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = basicPrisonUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
      referenceDataService,
      restrictionsService,
    },
    userSupplier: () => currentUser,
  })
  referenceDataService.getReferenceData.mockImplementation(mockedReferenceData)
  referenceDataService.getReferenceDescriptionForCode.mockResolvedValue('Mr')
  restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
    prisonerContactRestrictions: [],
    contactGlobalRestrictions: [],
  })
  contactsService.getLinkedPrisoners.mockResolvedValue({ content: [], page: { totalElements: 0 } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId', () => {
  describe('Contact Details', () => {
    it('should audit contact details page', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue({ content: [TestData.contactSearchResultItem()] })
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      expect(response.status).toEqual(200)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CONTACT_DETAILS_PAGE, {
        who: basicPrisonUser.username,
        correlationId: expect.any(String),
        details: {
          contactId: '1',
          prisonerContactId: '99',
          prisonerNumber: 'A1234BC',
        },
      })
      expect(contactsService.getContact).toHaveBeenCalledWith(1, basicPrisonUser)
      expect(contactsService.getPrisonerContactRelationship).toHaveBeenCalledWith(99, basicPrisonUser)
    })

    it('should render contact details page for living contact', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue({ content: [TestData.contactSearchResultItem()] })
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('title').text()).toStrictEqual('Information on a contact linked to a prisoner - DPS')
      expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Information on linked contact Jones Mason')
      expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
      const breadcrumbLinks = $('[data-qa=breadcrumbs] a')
      expect(breadcrumbLinks.eq(0).attr('href')).toStrictEqual('http://localhost:3001')
      expect(breadcrumbLinks.eq(0).text().trim()).toStrictEqual('Digital Prison Services')
      expect(breadcrumbLinks.eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
      expect(breadcrumbLinks.eq(1).text().trim()).toStrictEqual('Smith, John')
      expect(breadcrumbLinks.eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')
      expect(breadcrumbLinks.eq(2).text().trim()).toStrictEqual('Contacts')

      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=back-link]')).toHaveLength(0)
    })

    it('should render contact details page for deceased contact', async () => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue({
        ...TestData.contact(),
        deceasedDate: '2000-01-01',
      })
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect($('.govuk-heading-l').first().text().trim()).toStrictEqual(
        'Information on linked contact Jones Mason (deceased)',
      )

      expect($('[data-qa=breadcrumbs]')).toHaveLength(1)
      const breadcrumbLinks = $('[data-qa=breadcrumbs] a')
      expect(breadcrumbLinks.eq(0).attr('href')).toStrictEqual('http://localhost:3001')
      expect(breadcrumbLinks.eq(1).attr('href')).toStrictEqual('http://localhost:3001/prisoner/A1234BC')
      expect(breadcrumbLinks.eq(2).attr('href')).toStrictEqual('/prisoner/A1234BC/contacts/list')

      expect($('[data-qa=cancel-button]')).toHaveLength(0)
      expect($('[data-qa=back-link]')).toHaveLength(0)
    })

    it('should show a warning about contact images', async () => {
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      const warningText = $('[data-qa=image-warning]').text().trim()
      expect(response.status).toEqual(200)
      expect(warningText).toMatch(/Contact images are not yet available in DPS/)
      expect(warningText).toMatch(/You still need to use NOMIS to view and manage contact images./)
    })

    it('should not show comments when theres no comments', async () => {
      // Given
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contact = TestData.contact()
      delete contact.addresses[0]!.comments
      contactsService.getContact.mockResolvedValue(contact)

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)
      expect($('.confirm-comments-value').text().trim()).toStrictEqual('')
    })

    it.each([
      [basicPrisonUser, 200],
      [adminUser, 200],
      [authorisingUser, 200],
    ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
      currentUser = user
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      const contact = TestData.contact()
      contactsService.getContact.mockResolvedValue(contact)

      await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`).expect(expectedStatus)
    })
  })

  describe('Restrictions', () => {
    beforeEach(() => {
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.searchContact.mockResolvedValue({ content: [TestData.contactSearchResultItem()] })
      contactsService.getContact.mockResolvedValue(
        TestData.contact({ firstName: 'First', middleNames: 'Middle Names', lastName: 'Last' }),
      )
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
    })
    it('should render restrictions tab with global and prisoner-contact restrictions', async () => {
      currentUser = authorisingUser
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
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
        who: authorisingUser.username,
        correlationId: expect.any(String),
        details: {
          contactId: '1',
          prisonerContactId: '99',
          prisonerNumber: 'A1234BC',
        },
      })

      const $ = cheerio.load(response.text)
      expect(response.status).toEqual(200)

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (2)')

      expect($('.restrictions-caption-PRISONER_CONTACT').text()).toStrictEqual(
        'These restrictions apply to the relationship between prisoner John Smith and contact First Middle Names Last.',
      )
      expect($('.restrictions-caption-CONTACT_GLOBAL').text()).toStrictEqual(
        'These restrictions apply to contact First Middle Names Last across the whole prison estate.',
      )

      const relationshipRestrictionTitleText = $('[data-qa="PRISONER_CONTACT-1-type-value"]').text().trim()
      expect(relationshipRestrictionTitleText).toContain('Child Visitors to be Vetted')
      expect($('[data-qa="PRISONER_CONTACT-1-start-date-value"]').text().trim()).toStrictEqual('1/1/2024')
      expect($('[data-qa="PRISONER_CONTACT-1-expiry-date-value"]').text().trim()).toStrictEqual('1/8/2050')
      expect($('[data-qa="PRISONER_CONTACT-1-entered-by-value"]').text().trim()).toStrictEqual('User One')
      expect($('[data-qa="PRISONER_CONTACT-1-comments-value"]').text().trim()).toStrictEqual('Keep an eye')

      const globalRestrictionTitleText = $('[data-qa="CONTACT_GLOBAL-2-type-value"]').text().trim()
      expect(globalRestrictionTitleText).toContain('Keep under CCTV supervision')
      expect($('[data-qa="CONTACT_GLOBAL-2-start-date-value"]').text().trim()).toStrictEqual('2/1/2024')
      expect($('[data-qa="CONTACT_GLOBAL-2-expiry-date-value"]').text().trim()).toStrictEqual('1/8/2050')
      expect($('[data-qa="CONTACT_GLOBAL-2-entered-by-value"]').text().trim()).toStrictEqual('User One')
      expect($('[data-qa="CONTACT_GLOBAL-2-comments-value"]').text().trim()).toStrictEqual('Keep an eye')

      expect($('[data-qa=edit-restrictions-link]').text().trim()).toStrictEqual('Add or update restrictions')
    })

    it('should render global restrictions tab with expired restrictions', async () => {
      // Given
      currentUser = authorisingUser
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
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

      const globalRestrictionTitleText = $('[data-qa="CONTACT_GLOBAL-1-type-value"]').text().trim()
      expect(globalRestrictionTitleText).toContain('Child Visitors to be Vetted')
      expect(globalRestrictionTitleText).toContain('(expired)')
      expect($('[data-qa=edit-restrictions-link]').text().trim()).toStrictEqual('Add or update restrictions')
    })

    it('should render prisoner contact restrictions tab with expired restrictions', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
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

      const relationshipRestrictionTitleText = $('[data-qa="PRISONER_CONTACT-1-type-value"]').text().trim()
      expect(relationshipRestrictionTitleText).toContain('Child Visitors to be Vetted')
      expect(relationshipRestrictionTitleText).toContain('(expired)')
    })

    it('should render restrictions tab with no restrictions message', async () => {
      // Given
      currentUser = authorisingUser
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
        contactGlobalRestrictions: [],
        prisonerContactRestrictions: [],
      })

      // When
      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

      // Then
      const $ = cheerio.load(response.text)

      expect($('.restrictions-tab-title').text().trim()).toStrictEqual('Restrictions (0)')
      expect($('.restrictions-caption-PRISONER_CONTACT').text()).toStrictEqual(
        'No restrictions apply to the relationship between prisoner John Smith and contact First Middle Names Last.',
      )
      expect($('.restrictions-caption-CONTACT_GLOBAL').text()).toStrictEqual(
        'No restrictions apply to contact First Middle Names Last across the whole prison estate.',
      )

      expect($('[data-qa=edit-restrictions-link]').text().trim()).toStrictEqual('Add restrictions')
    })

    it('should show not entered text for expiry date and comments when not available', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
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

      expect($('[data-qa="PRISONER_CONTACT-2-expiry-date-value"]').text().trim()).toStrictEqual('Not provided')
      expect($('[data-qa="PRISONER_CONTACT-2-comments-value"]').text().trim()).toStrictEqual('Not provided')

      expect($('[data-qa="CONTACT_GLOBAL-1-expiry-date-value"]').text().trim()).toStrictEqual('Not provided')
      expect($('[data-qa="CONTACT_GLOBAL-1-comments-value"]').text().trim()).toStrictEqual('Not provided')
    })

    it.each([basicPrisonUser, adminUser])(
      'should hide link to edit restrictions if not an authorised user (%s)',
      async user => {
        // Given
        currentUser = user
        restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
          contactGlobalRestrictions: [],
          prisonerContactRestrictions: [],
        })

        // When
        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)

        // Then
        const $ = cheerio.load(response.text)

        expect($('[data-qa=edit-restrictions-link]')).toHaveLength(0)
      },
    )

    it('should show not show manage restriction link', async () => {
      // Given
      restrictionsService.getRelationshipAndGlobalRestrictions.mockResolvedValue({
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

      expect($('[data-qa=manage-CONTACT_GLOBAL-restriction-link-1]')).toHaveLength(0)
      expect($('[data-qa=manage-PRISONER_CONTACT-restriction-link-2]')).toHaveLength(0)
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
        '/prisoner/A1234BC/contacts/manage/1/relationship/99/update-employments',
      )
    })

    it('should render professional information tab with employment record', async () => {
      // Given
      const employment: EmploymentDetails = {
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
        '/prisoner/A1234BC/contacts/manage/1/relationship/99/update-employments',
      )
    })

    it('should render professional information tab with employment record missing optional values', async () => {
      // Given
      const employment: EmploymentDetails = {
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
          deceasedDate: '2000-12-25',
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
        expect($(personalInformationCard).find('dt:contains("Date of death")').next().text().trim()).toStrictEqual(
          '25 December 2000',
        )
        expect($(personalInformationCard).find('dt:contains("Gender")').next().text().trim()).toStrictEqual('Male')
        expect($(personalInformationCard).find('dt:contains("Staff member")').next().text().trim()).toStrictEqual('Yes')
        expect($('[data-qa=record-date-of-death-link]')).toHaveLength(0)
      })

      it('should render without optional personal details', async () => {
        const contactDetails = {
          ...TestData.contact(),
          firstName: 'First',
          lastName: 'Last',
          isStaff: false,
        } as ContactDetails
        delete contactDetails.titleCode
        delete contactDetails.titleDescription
        delete contactDetails.middleNames
        delete contactDetails.dateOfBirth
        delete contactDetails.genderCode
        delete contactDetails.genderDescription
        delete contactDetails.deceasedDate

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
        expect($(personalInformationCard).find('dt:contains("Date of death")')).toHaveLength(0)
        expect($(personalInformationCard).find('dt:contains("Gender")').next().text().trim()).toStrictEqual(
          'Not provided',
        )
        expect($(personalInformationCard).find('dt:contains("Staff member")').next().text().trim()).toStrictEqual('No')
        expect($('[data-qa=record-date-of-death-link]').attr('href')).toStrictEqual(
          '/prisoner/A1234BC/contacts/manage/22/relationship/99/enter-date-of-death?backTo=contact-details',
        )
      })
    })

    describe('Relationship to prisoner card', () => {
      it('should render with all relationship details', async () => {
        const prisonerContactRelationshipDetails = {
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          isEmergencyContact: true,
          isNextOfKin: true,
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
        expect($('.next-of-kin-tag')).toHaveLength(1)
        expect($('.emergency-contact-tag')).toHaveLength(1)
      })

      it('should render without optional relationship details', async () => {
        const prisonerContactRelationshipDetails = {
          relationshipTypeCode: 'O',
          relationshipTypeDescription: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
          isEmergencyContact: false,
          isNextOfKin: false,
          isRelationshipActive: false,
          isApprovedVisitor: false,
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
        expect($('.next-of-kin-tag')).toHaveLength(0)
        expect($('.emergency-contact-tag')).toHaveLength(0)
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
        const contactDetails: ContactDetails = {
          ...TestData.contact(),
          interpreterRequired: false,
        }
        delete contactDetails.languageCode
        delete contactDetails.languageDescription
        delete contactDetails.domesticStatusCode
        delete contactDetails.domesticStatusDescription
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
        expect($(phoneNumbersCard).find('dt:contains("Business")').first().next().text().trim()).toStrictEqual('5555')
        expect($(phoneNumbersCard).find('dt:contains("Business")').last().next().text().trim()).toStrictEqual(
          '1234, ext. 999',
        )
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
                  mailFlag: mail,
                  startDate: '2021-01-01',
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

          const addressCard = $(`h2:contains("${expectedTitle}")`).last().parent().parent()
          expect(addressCard).toHaveLength(1)
          expect($(addressCard).find('dt:contains("Type")').next().text().trim()).toStrictEqual(expectedType)
          expect($(addressCard).find('dt:contains("Address")').next().html()?.trim()).toMatch(
            /1a<br>\s+?Property<br>\s+?Street<br>\s+?Area<br>\s+?City<br>\s+?County<br>\s+?Postcode<br>\s+?England/,
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

          const addressCard = $(`h2:contains("${expectedTitle}")`).last().parent().parent()
          expect(addressCard).toHaveLength(1)
          expect($(addressCard).find('dt:contains("Type")').next().text().trim()).toStrictEqual(expectedType)
          expect($(addressCard).find('dt:contains("Address")').next().html()?.trim()).toMatch(
            /1a<br>\s+?Property<br>\s+?Street<br>\s+?Area<br>\s+?City<br>\s+?County<br>\s+?Postcode<br>\s+?England/,
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
                primaryAddress: false,
                countryCode: 'ENG',
                countryDescription: 'England',
                verified: false,
                mailFlag: false,
                startDate: '',
                noFixedAddress: true,
                phoneNumbers: [],
                createdBy: 'James',
                createdTime: '2021-01-01',
              } as ContactAddressDetails,
            ],
          }),
        )

        const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
        const $ = cheerio.load(response.text)

        const addressCard = $(`h2:contains("Address")`).last().parent().parent()
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
  describe('Linked prisoners tab', () => {
    it('should show linked prisoners table with count in the heading and no pagination if less than 50', async () => {
      const linkedPrisoners: LinkedPrisonerDetails[] = [
        {
          prisonerNumber: 'A1234BC',
          lastName: 'Last',
          firstName: 'First',
          prisonId: 'BXI',
          prisonName: 'Brixton (HMP)',
          prisonerContactId: 2,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social/Family',
          relationshipToPrisonerCode: 'MOT',
          relationshipToPrisonerDescription: 'Mother',
          isRelationshipActive: true,
        },
        {
          prisonerNumber: 'A1234BC',
          lastName: 'Last',
          firstName: 'First',
          prisonId: 'BXI',
          prisonName: 'Brixton (HMP)',
          prisonerContactId: 3,
          relationshipTypeCode: 'O',
          relationshipTypeDescription: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
          isRelationshipActive: false,
        },
        {
          prisonerNumber: 'X7896YZ',
          lastName: 'Smith',
          firstName: 'John',
          middleNames: 'Middle Names',
          prisonId: 'EXE',
          prisonName: 'Exeter (HMP)',
          prisonerContactId: 1,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social/Family',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
          isRelationshipActive: true,
        },
        {
          prisonerNumber: 'Z7896YZ',
          lastName: 'Smith',
          firstName: 'John',
          middleNames: 'Middle Names',
          prisonId: 'EXE',
          prisonName: 'Exeter (HMP)',
          prisonerContactId: 4,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social/Family',
          relationshipToPrisonerCode: 'UNC',
          relationshipToPrisonerDescription: 'Uncle',
          isRelationshipActive: true,
        },
      ]
      contactsService.getLinkedPrisoners.mockResolvedValue({ content: linkedPrisoners, page: { totalElements: 4 } })
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact())
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
      const $ = cheerio.load(response.text)

      // Should include all relationships in the count if a prisoner has more than one relationship to the contact
      expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (4)')
      const tableRows = $('.govuk-table__row')
      const firstRowColumns = tableRows.eq(1).find('td')
      expect(firstRowColumns.eq(0).text()).toContain('Last, First')
      expect(firstRowColumns.eq(0).text()).toContain('A1234BC')
      expect(firstRowColumns.eq(1).text()).toStrictEqual('Brixton (HMP)')
      expect(firstRowColumns.eq(2).text()).toStrictEqual('Social/Family')
      expect(firstRowColumns.eq(3).text()).toStrictEqual('Mother')
      expect(firstRowColumns.eq(4).text()).toStrictEqual('Active')

      const secondRowColumns = tableRows.eq(2).find('td')
      expect(secondRowColumns.eq(0).text()).toContain('Last, First')
      expect(secondRowColumns.eq(0).text()).toContain('A1234BC')
      expect(secondRowColumns.eq(1).text()).toStrictEqual('Brixton (HMP)')
      expect(secondRowColumns.eq(2).text()).toStrictEqual('Official')
      expect(secondRowColumns.eq(3).text()).toStrictEqual('Doctor')
      expect(secondRowColumns.eq(4).text()).toStrictEqual('Inactive')

      const thirdRowColumns = tableRows.eq(3).find('td')
      expect(thirdRowColumns.eq(0).text()).toContain('Smith, John Middle Names')
      expect(thirdRowColumns.eq(0).text()).toContain('X7896YZ')
      expect(thirdRowColumns.eq(1).text()).toStrictEqual('Exeter (HMP)')
      expect(thirdRowColumns.eq(2).text()).toStrictEqual('Social/Family')
      expect(thirdRowColumns.eq(3).text()).toStrictEqual('Friend')
      expect(thirdRowColumns.eq(4).text()).toStrictEqual('Active')

      const fourthRowColumns = tableRows.eq(4).find('td')
      expect(fourthRowColumns.eq(0).text()).toContain('Smith, John Middle Names')
      expect(fourthRowColumns.eq(0).text()).toContain('Z7896YZ')
      expect(fourthRowColumns.eq(1).text()).toStrictEqual('Exeter (HMP)')
      expect(fourthRowColumns.eq(2).text()).toStrictEqual('Social/Family')
      expect(fourthRowColumns.eq(3).text()).toStrictEqual('Uncle')
      expect(fourthRowColumns.eq(4).text()).toStrictEqual('Active')

      expect($('.moj-pagination__list').find('li')).toHaveLength(0)
    })

    it('should show pagination if more than 50', async () => {
      const linkedPrisoners: LinkedPrisonerDetails[] = Array(50)
        .fill(0)
        .map(
          (_, i) =>
            ({
              prisonerNumber: `A${i}BC`,
              lastName: `Last`,
              firstName: 'First',
              prisonId: 'BXI',
              prisonName: 'Brixton (HMP)',
              prisonerContactId: i,
              relationshipTypeCode: 'S',
              relationshipTypeDescription: 'Social/Family',
              relationshipToPrisonerCode: 'MOT',
              relationshipToPrisonerDescription: 'Mother',
              isRelationshipActive: true,
            }) as LinkedPrisonerDetails,
        )

      contactsService.getLinkedPrisoners.mockResolvedValue({ content: linkedPrisoners, page: { totalElements: 240 } })
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ id: 1 }))
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      const response = await request(app).get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99`)
      const $ = cheerio.load(response.text)

      // Should include all relationships in the count if a prisoner has more than one relationship to the contact
      expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (240)')

      linkedPrisoners.forEach(linkedPrisoner => {
        const rowColumns = $('.govuk-table__row')
          .eq(linkedPrisoner.prisonerContactId + 1)
          .find('td')
        expect(rowColumns.eq(0).text()).toContain(linkedPrisoner.prisonerNumber)
      })
      expect($('.moj-pagination__list')).toHaveLength(2)
      expect(contactsService.getLinkedPrisoners).toHaveBeenCalledWith(1, 0, 50, basicPrisonUser)
    })

    it('should load the relevant page if not default', async () => {
      const linkedPrisoners: LinkedPrisonerDetails[] = Array(50)
        .fill(0)
        .map(
          (_, i) =>
            ({
              prisonerNumber: `A${i}BC`,
              lastName: `Last`,
              firstName: 'First',
              prisonId: 'BXI',
              prisonName: 'Brixton (HMP)',
              prisonerContactId: i + 50,
              relationshipTypeCode: 'S',
              relationshipTypeDescription: 'Social/Family',
              relationshipToPrisonerCode: 'MOT',
              relationshipToPrisonerDescription: 'Mother',
              isRelationshipActive: true,
            }) as LinkedPrisonerDetails,
        )

      contactsService.getLinkedPrisoners.mockResolvedValue({ content: linkedPrisoners, page: { totalElements: 240 } })
      prisonerSearchService.getByPrisonerNumber.mockResolvedValue(TestData.prisoner())
      contactsService.getContact.mockResolvedValue(TestData.contact({ id: 1 }))
      contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99?linkedPrisonerPage=2`,
      )
      const $ = cheerio.load(response.text)

      // Should include all relationships in the count if a prisoner has more than one relationship to the contact
      expect($('.linked-prisoners-tab-title').text().trim()).toStrictEqual('Linked prisoners (240)')

      linkedPrisoners.forEach(linkedPrisoner => {
        const rowColumns = $('.govuk-table__row')
          .eq(linkedPrisoner.prisonerContactId - 49)
          .find('td')
        expect(rowColumns.eq(0).text()).toContain(linkedPrisoner.prisonerNumber)
      })
      expect($('.moj-pagination__list').find('li').length).toBeGreaterThan(0)
      expect(contactsService.getLinkedPrisoners).toHaveBeenCalledWith(
        1,
        1 /* page number is 0 indexed so page 2 = page 1 API */,
        50,
        basicPrisonUser,
      )
    })
  })
})
