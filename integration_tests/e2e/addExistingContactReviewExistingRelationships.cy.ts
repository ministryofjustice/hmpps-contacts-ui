import Page from '../pages/page'
import LinkExistingContactCYAPage from '../pages/linkExistingContactCYAPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactMatchPage from '../pages/contactMatchPage'
import AddContactSuccessPage from '../pages/addContactSuccessPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ReviewExistingRelationshipsPage from '../pages/ReviewExistingRelationshipsPage'
import { PrisonerContactSummary } from '../../server/@types/contactsApiClient'

context('Add existing contact when search reveals some existing relationships', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Contact',
    firstName: 'Existing',
  })

  const globalRestriction = TestData.getContactRestrictionDetails({ contactId: contact.id })
  const minimalContact: PrisonerContactSummary = {
    prisonerContactId: 987654321,
    contactId,
    prisonerNumber,
    lastName: 'Contact',
    firstName: 'Existing',
    relationshipTypeCode: 'S',
    relationshipTypeDescription: 'Social',
    relationshipToPrisonerCode: 'FR',
    relationshipToPrisonerDescription: 'Father',
    isApprovedVisitor: false,
    isNextOfKin: false,
    isEmergencyContact: false,
    isRelationshipActive: true,
    currentTerm: true,
    isStaff: true,
    restrictionSummary: {
      active: [],
      totalActive: 0,
      totalExpired: 0,
    },
  }

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetGlobalRestrictions', [globalRestriction])
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubAddContactRelationship', { contactId, createdPrisonerContactId: prisonerContactId })

    const searchResult = TestData.contactSearchResultItem({
      id: contact.id,
      lastName: contact.lastName,
      firstName: contact.firstName,
      middleNames: contact.middleNames,
      existingRelationships: [
        {
          prisonerContactId: 123456789,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social',
          relationshipToPrisonerCode: 'MOT',
          relationshipToPrisonerDescription: 'Mother',
          isRelationshipActive: true,
        },
      ],
    })

    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [searchResult],
      },
    })

    cy.task('stubAllSummariesForAPrisonerAndContact', {
      prisonerNumber,
      contactId,
      items: [
        // the one we are editing
        {
          ...minimalContact,
          prisonerContactId,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social',
          relationshipToPrisonerCode: 'OTHER',
          relationshipToPrisonerDescription: 'Other',
        },
      ],
    })

    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      employments: [],
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()
  })

  it('Can review the existing contact records from the search screen', () => {
    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickLinkTo('View existing record', ReviewExistingRelationshipsPage)
      .clickLinkTo('Back to contact search', SearchContactPage)
      .clickLinkTo('View existing record', ReviewExistingRelationshipsPage)
      .clickLinkTo('link this contact to the prisoner again', ContactMatchPage, 'Existing Contact', 'John Smith')
      .selectIsTheRightPersonYesRadio()
      .continueTo(SelectRelationshipTypePage, 'Existing Contact', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'Existing Contact', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true, 'John Smith', true) //
      .continueTo(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .continueTo(LinkExistingContactCYAPage)
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
      },
    )
  })

  it('Can review the existing contact records from the match screen and continue to add a contact', () => {
    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickLinkTo('Check if this is the correct contact', ContactMatchPage, 'Existing Contact', 'John Smith')
      .clickLinkTo('View existing record', ReviewExistingRelationshipsPage)
      .clickLinkTo('Back to contact search', SearchContactPage)
      .clickLinkTo('Check if this is the correct contact', ContactMatchPage, 'Existing Contact', 'John Smith')
      .selectIsTheRightPersonYesRadio()
      .continueTo(SelectRelationshipTypePage, 'Existing Contact', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'Existing Contact', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true, 'John Smith', true) //
      .continueTo(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .continueTo(LinkExistingContactCYAPage)
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
      },
    )
  })

  it('Should be able to go back to the contact list', () => {
    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickLinkTo('View existing record', ReviewExistingRelationshipsPage)
      .clickLinkTo('go back to the prisoner’s contact list', ListContactsPage, 'John Smith')
  })

  it('Should be able to go back to the existing record', () => {
    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickLinkTo('View existing record', ReviewExistingRelationshipsPage)
      .clickLinkTo('Contact, Existing', ManageContactDetailsPage, 'Existing Contact')
  })

  it('Can review the existing contact records from the match screen and then continue back to the contact list', () => {
    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickLinkTo('Check if this is the correct contact', ContactMatchPage, 'Existing Contact', 'John Smith')
      .selectIsTheRightPersonNoGoToContactList()
      .continueTo(ListContactsPage, 'John Smith')
  })
})
