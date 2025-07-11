import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Cheerio } from 'cheerio'
import { Element } from 'domhandler'
import { adminUser, appWithAllRoutes, authorisingUser, basicPrisonUser } from '../../../testutils/appSetup'
import TestData from '../../../testutils/testData'
import { MockedService } from '../../../../testutils/mockedServices'
import { Page } from '../../../../services/auditService'
import { ContactDetails, PrisonerContactRelationshipDetails } from '../../../../@types/contactsApiClient'
import { HmppsUser } from '../../../../interfaces/hmppsUser'

jest.mock('../../../../services/auditService')
jest.mock('../../../../services/prisonerSearchService')
jest.mock('../../../../services/contactsService')

const auditService = MockedService.AuditService()
const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

let app: Express
const prisonerNumber = 'A1234BC'
let currentUser: HmppsUser

beforeEach(() => {
  currentUser = adminUser
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      contactsService,
    },
    userSupplier: () => currentUser,
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
      who: adminUser.username,
      correlationId: expect.any(String),
      details: {
        contactId: '1',
        prisonerContactId: '99',
        prisonerNumber: 'A1234BC',
      },
    })
    expect(contactsService.getContact).toHaveBeenCalledWith(1, adminUser)
    expect(contactsService.getPrisonerContactRelationship).toHaveBeenCalledWith(99, adminUser)
  })

  it.each([
    [basicPrisonUser, 403],
    [adminUser, 200],
    [authorisingUser, 200],
  ])('GET should block access without required roles (%j, %s)', async (user: HmppsUser, expectedStatus: number) => {
    currentUser = user
    await request(app)
      .get(`/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`)
      .expect(expectedStatus)
  })

  it('should have correct navigation', async () => {
    const response = await request(app).get(
      `/prisoner/${prisonerNumber}/contacts/manage/1/relationship/99/edit-contact-details`,
    )
    const $ = cheerio.load(response.text)
    expect($('title').text()).toStrictEqual('Edit contact details for a contact linked to a prisoner - DPS')
    expect($('.govuk-heading-l').first().text().trim()).toStrictEqual('Edit contact details for Jones Mason')
    expect($('.govuk-caption-l').first().text().trim()).toStrictEqual('Manage contacts')
    expect($('[data-qa=breadcrumbs]')).toHaveLength(0)
    expect($('[data-qa=cancel-button]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
    expect($('.govuk-back-link').text().trim()).toStrictEqual('Back to contact record')
    expect($('[data-qa=back-link]').first().attr('href')).toStrictEqual(
      '/prisoner/A1234BC/contacts/manage/1/relationship/99',
    )
  })

  describe('Personal details card', () => {
    it('should render with all personal details and change links', async () => {
      const contactDetails = {
        ...TestData.contact(),
        titleCode: 'MR',
        titleDescription: 'Mr',
        firstName: 'First',
        middleNames: 'Middle Names',
        lastName: 'Last',
        dateOfBirth: '1982-06-15',
        genderCode: 'M',
        genderDescription: 'Male',
        isStaff: true,
        deceasedDate: '2000-12-25',
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
        'Date of death',
        '25 December 2000',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/enter-date-of-death',
        'Change the contact’s date of death (Personal information)',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/delete-date-of-death',
        'Delete the contact’s date of death (Personal information)',
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
      expect($('[data-qa=record-date-of-death-link]').attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/enter-date-of-death?backTo=edit-contact-details',
      )
    })
  })

  describe('Relationship details card', () => {
    it('should render with all relationship details and change links as authorising user', async () => {
      currentUser = authorisingUser
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/edit-relationship-type/all/start',
        'Change relationship type (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship to prisoner',
        'Friend',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/edit-relationship-type/relationship-to-prisoner/start',
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact-or-next-of-kin',
        'Change if the contact is the prisoner’s emergency contact (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Next of kin',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact-or-next-of-kin',
        'Change if the contact is the prisoner’s next of kin (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Approved for visits',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/approved-to-visit',
        'Change if the contact is approved to visit the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Comments',
        'Some comments',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-comments',
        'Change the comments on the relationship (Relationship to prisoner Incarcerated Individual)',
      )
      expect($('a:contains("Delete relationship")').attr('href')).toStrictEqual(
        `/prisoner/${prisonerNumber}/contacts/manage/22/relationship/99/delete?backTo=edit-contact-details`,
      )
    })

    it('should render without optional relationship details as authorising user', async () => {
      currentUser = authorisingUser
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/edit-relationship-type/all/start',
        'Change relationship type (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Relationship to prisoner',
        'Doctor',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/edit-relationship-type/relationship-to-prisoner/start',
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact-or-next-of-kin',
        'Change if the contact is the prisoner’s emergency contact (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Next of kin',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/emergency-contact-or-next-of-kin',
        'Change if the contact is the prisoner’s next of kin (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Approved for visits',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/approved-to-visit',
        'Change if the contact is approved to visit the prisoner (Relationship to prisoner Incarcerated Individual)',
      )
      expectSummaryListItem(
        relationshipInformationCard,
        'Comments',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/relationship-comments',
        'Change the comments on the relationship (Relationship to prisoner Incarcerated Individual)',
      )
    })

    it('should hide change link for visits approval if the user does not have permission', async () => {
      currentUser = adminUser
      const prisonerContactRelationshipDetails = {
        prisonerContactId: 99,
        relationshipTypeCode: 'O',
        relationshipTypeDescription: 'Official',
        relationshipToPrisonerCode: 'DR',
        relationshipToPrisonerDescription: 'Doctor',
        isEmergencyContact: false,
        isNextOfKin: false,
        isRelationshipActive: false,
        isApprovedVisitor: true,
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
      expect(relationshipInformationCard.find(`dt:contains("Approved for visits")`).first()).toHaveLength(1)
      expect($('[data-qa=change-approved-visitor-link]')).toHaveLength(0)
      expect($('[data-qa=cant-approve-visit-hint]').first().text().trim()).toStrictEqual(
        'Cannot be changed as you do not have permission to authorise visits on DPS.',
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/1/delete',
      )

      const firstPassportHeading = $(identityDocCard).find('dt:contains("Passport number")').first()
      expect(firstPassportHeading.next().text().trim()).toMatch(/5555/)
      expect(firstPassportHeading.next().text().trim()).toMatch(/Issued by Passport Office/)
      expect(firstPassportHeading.next().next().find('a')).toHaveLength(2)
      expect(firstPassportHeading.next().next().find('a').first().text()).toStrictEqual(
        'Change the information about this Passport number (Identity documentation)',
      )
      expect(firstPassportHeading.next().next().find('a').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/3/edit',
      )
      expect(firstPassportHeading.next().next().find('a').last().text()).toStrictEqual(
        'Delete the information about this Passport number (Identity documentation)',
      )
      expect(firstPassportHeading.next().next().find('a').last().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/3/delete',
      )

      const secondPassportHeading = $(identityDocCard).find('dt:contains("Passport number")').last()
      expect(secondPassportHeading.next().text().trim()).toStrictEqual('6666')
      expect(secondPassportHeading.next().next().find('a')).toHaveLength(2)
      expect(secondPassportHeading.next().next().find('a').first().text()).toStrictEqual(
        'Change the information about this Passport number (Identity documentation)',
      )
      expect(secondPassportHeading.next().next().find('a').first().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/2/edit',
      )
      expect(secondPassportHeading.next().next().find('a').last().text()).toStrictEqual(
        'Delete the information about this Passport number (Identity documentation)',
      )
      expect(secondPassportHeading.next().next().find('a').last().attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/2/delete',
      )

      const addIdentityDocLink = $('a:contains("Add identity document")')
      expect(addIdentityDocLink).toHaveLength(1)
      expect(addIdentityDocLink.attr('href')).toStrictEqual(
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/create',
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/identity/create',
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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/language-and-interpreter#language',
        'Change the contact’s first language (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Interpreter required',
        'Yes',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/language-and-interpreter#interpreterRequired',
        'Change if an interpreter is required (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Contact’s domestic status',
        'Married',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/domestic-status',
        'Change the contact’s domestic status (Additional information)',
      )
    })

    it('should render without optional additional information and change links', async () => {
      const contactDetails: ContactDetails = {
        ...TestData.contact(),
        interpreterRequired: false,
      }
      delete contactDetails.languageCode
      delete contactDetails.languageDescription
      delete contactDetails.domesticStatusCode
      delete contactDetails.domesticStatusDescription

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
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/language-and-interpreter#language',
        'Change the contact’s first language (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Interpreter required',
        'No',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/language-and-interpreter#interpreterRequired',
        'Change if an interpreter is required (Additional information)',
      )
      expectSummaryListItem(
        additionalInfoCard,
        'Contact’s domestic status',
        'Not provided',
        '/prisoner/A1234BC/contacts/manage/22/relationship/99/domestic-status',
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
    deleteLink?: string,
    deleteLabel?: string,
  ) => {
    const summaryCardFirstColumn = card.find(`dt:contains("${label}")`).first()
    expect(summaryCardFirstColumn.next().text().trim()).toStrictEqual(value)
    const firstLink = summaryCardFirstColumn.next().next().find('a').first()
    expect(firstLink.attr('href')).toStrictEqual(changeLink)
    expect(firstLink.text().trim()).toStrictEqual(changeLabel)
    if (deleteLink && deleteLabel) {
      const secondLink = summaryCardFirstColumn.next().next().find('a').last()
      expect(secondLink.attr('href')).toStrictEqual(deleteLink)
      expect(secondLink.text().trim()).toStrictEqual(deleteLabel)
    }
  }
})
