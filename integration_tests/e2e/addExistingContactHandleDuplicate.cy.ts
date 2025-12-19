import Page from '../pages/page'
import LinkExistingContactCYAPage from '../pages/linkExistingContactCYAPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactMatchPage from '../pages/contactMatchPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import HandleDuplicateRelationshipPage from '../pages/handleDuplicateRelationshipPage'
import { PrisonerContactSummary } from '../../server/@types/contactsApiClient'
import ManageContactDetailsPage from '../pages/manageContactDetails'

context('Add existing contact should handle duplicate error from server', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const duplicatePrisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Contact',
    firstName: 'Existing',
  })
  const searchResult = TestData.contactSearchResultItem({
    id: contact.id,
    lastName: contact.lastName,
    firstName: contact.firstName,
    middleNames: contact.middleNames,
  })
  const minimalContact: PrisonerContactSummary = {
    prisonerContactId: duplicatePrisonerContactId,
    contactId: 123456789,
    prisonerNumber,
    lastName: 'Last',
    firstName: 'First',
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

  const globalRestriction = TestData.getContactRestrictionDetails({ contactId: contact.id })

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
      id: duplicatePrisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: duplicatePrisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [searchResult],
      },
      lastName: 'Contact',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })

    cy.task('stubAddContactRelationshipHasConflict')

    cy.task('stubAllSummariesForAPrisonerAndContact', {
      prisonerNumber,
      contactId,
      items: [
        {
          ...minimalContact,
          prisonerContactId: duplicatePrisonerContactId,
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social',
          relationshipToPrisonerCode: 'MOT',
          relationshipToPrisonerDescription: 'Mother',
        },
      ],
    })

    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      employments: [],
    })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactMatchPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Existing Contact', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true, 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .clickContinue()

    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
  })

  it('Can add an existing contact with only optional fields', () => {
    Page.verifyOnPage(HandleDuplicateRelationshipPage, true)
      .selectAction('GO_TO_CONTACT_LIST')
      .continueTo(ListContactsPage, 'John Smith')
  })

  it('Can add an existing contact with only optional fields', () => {
    Page.verifyOnPage(HandleDuplicateRelationshipPage, true)
      .selectAction('GO_TO_DUPE')
      .continueTo(ManageContactDetailsPage, 'Existing Contact')
  })
})
