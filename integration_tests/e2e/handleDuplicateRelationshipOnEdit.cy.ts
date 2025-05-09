import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import HandleDuplicateRelationshipPage from '../pages/handleDuplicateRelationshipPage'
import ListContactsPage from '../pages/listContacts'
import { PrisonerContactSummary } from '../../server/@types/contactsApiClient'

context('Handle duplicate relationship when editing relationships', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const duplicatePrisonerContactId = 1565478941
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    titleCode: 'MR',
    dateOfBirth: null,
  })
  const minimalContact: PrisonerContactSummary = {
    prisonerContactId: 987654321,
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

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: duplicatePrisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })

    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })

    const theRelationshipBeingEdited = TestData.prisonerContactRelationship({
      prisonerContactId,
      relationshipTypeCode: 'S',
      relationshipTypeDescription: 'Social',
      relationshipToPrisonerCode: 'OTHER',
      relationshipToPrisonerDescription: 'Other',
      comments: 'editing this one',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: theRelationshipBeingEdited,
    })

    const theExistingDuplicateRelationship = TestData.prisonerContactRelationship({
      prisonerContactId: duplicatePrisonerContactId,
      relationshipTypeCode: 'O',
      relationshipTypeDescription: 'Official',
      relationshipToPrisonerCode: 'DR',
      relationshipToPrisonerDescription: 'Doctor',
      comments: 'the duplicate',
    })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: duplicatePrisonerContactId,
      response: theExistingDuplicateRelationship,
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    cy.task('stubUpdateContactRelationshipByIdHasConflict', {
      prisonerContactId,
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
        {
          ...minimalContact,
          prisonerContactId: duplicatePrisonerContactId,
          relationshipTypeCode: 'O',
          relationshipTypeDescription: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
        },
      ],
    })
  })

  it('When changing type and relationship to prisoner can go to contact list', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo('Edit contact details', EditContactDetailsPage, 'First Middle Names Last')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Names Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(HandleDuplicateRelationshipPage)
      .selectAction('GO_TO_CONTACT_LIST')
      .continueTo(ListContactsPage, 'John Smith')
  })

  it('When changing type and relationship to prisoner can go to prisoner contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo('Edit contact details', EditContactDetailsPage, 'First Middle Names Last')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Names Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Names Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(HandleDuplicateRelationshipPage)
      .selectAction('GO_TO_DUPE')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
