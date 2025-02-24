import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { Page } from '../../../../services/auditService'
import ContactDetails = contactsApiClientTypes.ContactDetails
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

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

describe('GET /contacts/manage/:contactId/relationship/:prisonerContactId/edit-contact-details', () => {
  beforeEach(() => {
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(
      TestData.prisoner({ firstName: 'Incarcerated', lastName: 'Individual' }),
    )
    contactsService.getContact.mockResolvedValue(TestData.contact())
    contactsService.getPrisonerContactRelationship.mockResolvedValue(TestData.prisonerContactRelationship())
  })

  it('should audit page view', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
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
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
    )
    const $ = cheerio.load(response.text)
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Edit contact details for Jones Mason')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
  })

  describe('Personal details card', () => {
    it('should render with all personal details and change links', async () => {
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
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )
      const $ = cheerio.load(response.text)

      const personalInformationCard = $('h2:contains("Personal information")').parent().parent()
      expect(personalInformationCard).toHaveLength(1)
      expectSummaryListItem(
        personalInformationCard,
        'Title',
        'Mr',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/change-contact-title-or-middle-names#title',
        'Change the contact’s title (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Name',
        'First Middle Names Last',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/change-contact-title-or-middle-names#middleNames',
        'Change middle name (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Date of birth',
        '15 June 1982',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/update-dob',
        'Change the contact’s date of birth (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Gender',
        'Male',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/gender',
        'Change the contact’s gender (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Staff member',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/staff',
        'Change if the contact is a member of staff (Personal information)',
      )
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
      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )
      const $ = cheerio.load(response.text)
      const personalInformationCard = $('h2:contains("Personal information")').parent().parent()
      expect(personalInformationCard).toHaveLength(1)
      expectSummaryListItem(
        personalInformationCard,
        'Title',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/change-contact-title-or-middle-names#title',
        'Change the contact’s title (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Name',
        'First Last',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/change-contact-title-or-middle-names#middleNames',
        'Add middle name (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Date of birth',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/update-dob',
        'Change the contact’s date of birth (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Gender',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/gender',
        'Change the contact’s gender (Personal information)',
      )
      expectSummaryListItem(
        personalInformationCard,
        'Staff member',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/staff',
        'Change if the contact is a member of staff (Personal information)',
      )
    })
  })

  describe('Relationship details card', () => {
    it('should render with all relationship details and change links', async () => {
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
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

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )

      const $ = cheerio.load(response.text)
      const relationshipInformationCard = $('h2:contains("Relationship to prisoner Incarcerated Individual")')
        .parent()
        .parent()
      expect(relationshipInformationCard).toHaveLength(1)
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship type',
        'Social',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/type/start',
        'Change relationship type (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship to prisoner',
        'Friend',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/update-relationship-to-prisoner',
        'Change the relationship to the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship status',
        'Active',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-status',
        'Change the status of the relationship (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Emergency contact',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if the contact is the prisoner’s emergency contact (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Next of kin',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/next-of-kin?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if the contact is the prisoner’s next of kin (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Approved for visits',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/approved-to-visit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if the contact is approved to visit the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Comments',
        'Some comments',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-comments?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change the comments on the relationship (Relationship to prisoner Incarcerated Individual)',
      )
    })

    it('should render without optional relationship details', async () => {
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
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

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )

      const $ = cheerio.load(response.text)
      const relationshipInformationCard = $('h2:contains("Relationship to prisoner Incarcerated Individual")')
        .parent()
        .parent()
      expect(relationshipInformationCard).toHaveLength(1)
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship type',
        'Official',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/type/start',
        'Change relationship type (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship to prisoner',
        'Doctor',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/update-relationship-to-prisoner',
        'Change the relationship to the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship status',
        'Inactive',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-status',
        'Change the status of the relationship (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Emergency contact',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if the contact is the prisoner’s emergency contact (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Next of kin',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/next-of-kin?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if the contact is the prisoner’s next of kin (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Approved for visits',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/approved-to-visit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if the contact is approved to visit the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Comments',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-comments?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change the comments on the relationship (Relationship to prisoner Incarcerated Individual)',
      )
    })
  })

  describe('Identity documents card', () => {
    it('should render with all identity documents with change and delete links', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          identities: [
            TestData.getContactIdentityDetails('PASS', 'Passport number', '5555', 'Passport Office', 3, true),
            TestData.getContactIdentityDetails('PASS', 'Passport number', '6666', undefined, 2, true),
            TestData.getContactIdentityDetails('DL', 'Driving licence', '123456', undefined, 1, false),
          ],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )

      const $ = cheerio.load(response.text)
      const identityDocCard = $('h2:contains("Identity documentation")').parent().parent()
      expect(identityDocCard).toHaveLength(1)

      // driving licence is inactive type so should display hint and no change link
      const drivingLicenceHeading = $(identityDocCard).find('dt:contains("Driving licence")')
      expect(drivingLicenceHeading.text().trim()).toMatch(
        /Cannot be changed as the document type is no longer supported in DPS and NOMIS./,
      )
      expect(drivingLicenceHeading.next().text().trim()).toMatch(/123456/)
      expect(drivingLicenceHeading.next().next().find('a')).toHaveLength(1)
      expect(drivingLicenceHeading.next().next().find('a').text()).toStrictEqual(
        'Delete the information about this Driving licence (Identity documentation)',
      )
      expect(drivingLicenceHeading.next().next().find('a').attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/1/delete?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )

      const firstPassportHeading = $(identityDocCard).find('dt:contains("Passport number")').first()
      expect(firstPassportHeading.next().text().trim()).toMatch(/5555/)
      expect(firstPassportHeading.next().text().trim()).toMatch(/Issued by Passport Office/)
      expect(firstPassportHeading.next().next().find('a')).toHaveLength(2)
      expect(firstPassportHeading.next().next().find('a').first().text()).toStrictEqual(
        'Change the information about this Passport number (Identity documentation)',
      )
      expect(firstPassportHeading.next().next().find('a').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/3/edit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )
      expect(firstPassportHeading.next().next().find('a').last().text()).toStrictEqual(
        'Delete the information about this Passport number (Identity documentation)',
      )
      expect(firstPassportHeading.next().next().find('a').last().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/3/delete?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )

      const secondPassportHeading = $(identityDocCard).find('dt:contains("Passport number")').last()
      expect(secondPassportHeading.next().text().trim()).toStrictEqual('6666')
      expect(secondPassportHeading.next().next().find('a')).toHaveLength(2)
      expect(secondPassportHeading.next().next().find('a').first().text()).toStrictEqual(
        'Change the information about this Passport number (Identity documentation)',
      )
      expect(secondPassportHeading.next().next().find('a').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/2/edit?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )
      expect(secondPassportHeading.next().next().find('a').last().text()).toStrictEqual(
        'Delete the information about this Passport number (Identity documentation)',
      )
      expect(secondPassportHeading.next().next().find('a').last().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/2/delete?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )

      const addIdentityDocLink = $('a:contains("Add identity document")')
      expect(addIdentityDocLink).toHaveLength(1)
      expect(addIdentityDocLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/create?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )
    })

    it('should render no identity documentation provided with add link', async () => {
      contactsService.getContact.mockResolvedValue(
        TestData.contact({
          identities: [],
        }),
      )

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )
      const $ = cheerio.load(response.text)

      const identityDocCard = $('h2:contains("Identity documentation")').parent().parent()
      expect(identityDocCard).toHaveLength(1)
      expect($(identityDocCard).text()).toMatch(/No identity documents provided./)

      const addIdentityDocLink = $('a:contains("Add identity document")')
      expect(addIdentityDocLink).toHaveLength(1)
      expect(addIdentityDocLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/identity/create?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
      )
    })
  })

  describe('Additional information card', () => {
    it('should render with all additional information and change links', async () => {
      const contactDetails = {
        ...TestData.contact(),
        languageCode: 'EN',
        languageDescription: 'English',
        interpreterRequired: true,
        domesticStatusCode: 'M',
        domesticStatusDescription: 'Married',
      }
      contactsService.getContact.mockResolvedValue(contactDetails)

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )

      const $ = cheerio.load(response.text)
      const additionalInfoCard = $('h2:contains("Additional information")').parent().parent()
      expect(additionalInfoCard).toHaveLength(1)

      expectSummaryListItem(
        additionalInfoCard,
        'Contact’s first language',
        'English',
        '/prisoner/A1234BC/contacts/manage/22/language?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change the contact’s first language (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Interpreter required',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/interpreter?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if an interpreter is required (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Contact’s domestic status',
        'Married',
        '/prisoner/A1234BC/contacts/manage/22/domestic-status?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change the contact’s domestic status (Additional information)',
      )
    })

    it('should render without optional additional information and change links', async () => {
      const contactDetails = {
        ...TestData.contact(),
        languageCode: undefined,
        languageDescription: undefined,
        interpreterRequired: false,
        domesticStatusCode: undefined,
        domesticStatusDescription: undefined,
      }
      contactsService.getContact.mockResolvedValue(contactDetails)

      const response = await request(app).get(
        `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
      )

      const $ = cheerio.load(response.text)
      const additionalInfoCard = $('h2:contains("Additional information")').parent().parent()
      expect(additionalInfoCard).toHaveLength(1)
      expectSummaryListItem(
        additionalInfoCard,
        'Contact’s first language',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/language?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change the contact’s first language (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Interpreter required',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/interpreter?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change if an interpreter is required (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Contact’s domestic status',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/domestic-status?returnUrl=/prisoner/A1234BC/contacts/manage/1/relationship/99/edit-contact-details',
        'Change the contact’s domestic status (Additional information)',
      )
    })
  })

  const expectSummaryListItem = (
    card: Cheerio<Element>,
    label: string,
    value: string,
    changeLink: string,
    changeLabel: string,
  ) => {
    const summaryCardFirstColumn = card.find(`dt:contains("${label}")`).first()
    expect(summaryCardFirstColumn.next().text().trim()).toStrictEqual(value)
    const link = summaryCardFirstColumn.next().next().find('a')
    expect(link.attr('href')).toStrictEqual(changeLink)
    expect(link.text().trim()).toStrictEqual(changeLabel)
  }
})
