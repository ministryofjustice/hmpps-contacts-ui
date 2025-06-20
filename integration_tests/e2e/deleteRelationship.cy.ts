import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import DeleteRelationshipPage from '../pages/deleteRelationshipPage'
import ListContactsPage from '../pages/listContacts'
import { PagedModelPrisonerContactSummary } from '../../server/@types/contactsApiClient'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Delete Relationship', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const { prisonerNumber } = TestData.prisoner()
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    titleCode: 'MR',
    dateOfBirth: null,
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        relationshipTypeCode: 'S',
        relationshipTypeDescription: 'Social',
        relationshipToPrisonerCode: 'FRI',
        relationshipToPrisonerDescription: 'Friend',
      }),
    })

    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })

    cy.task('stubAllSummariesForAPrisonerAndContact', {
      prisonerNumber,
      contactId,
      items: [
        {
          prisonerContactId,
          contactId,
          prisonerNumber,
          lastName: 'Last',
          firstName: 'First',
          relationshipTypeCode: 'S',
          relationshipTypeDescription: 'Social',
          relationshipToPrisonerCode: 'FRI',
          relationshipToPrisonerDescription: 'Friend',
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
        },
      ],
    })
    const contactListPage: PagedModelPrisonerContactSummary = {
      content: [],
      page: { totalElements: 0, totalPages: 1, size: 10, number: 0 },
    }
    cy.task('stubFilteredContactList', {
      prisonerNumber: 'A1234BC',
      page: contactListPage,
      matchQueryParams: { active: { absent: true } },
    })
  })

  xit('Can delete if the relationship has no restrictions', () => {
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [TestData.getContactRestrictionDetails()],
      },
    })
    cy.task('stubDeleteContactRelationship', { prisonerContactId })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo(
        'Delete relationship (Relationship to prisoner John Smith)',
        DeleteRelationshipPage,
        true,
        'John Smith',
        'First Middle Names Last',
      )
      .clickButtonTo('Yes, delete', ListContactsPage, 'John Smith')
      .hasSuccessBanner('You’ve deleted a relationship from John Smith’s contact list.')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      1,
    )
  })

  xit('Cannot delete the relationship if it has relationship restrictions, return to contact list', () => {
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails()],
        contactGlobalRestrictions: [],
      },
    })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo(
        'Delete relationship (Relationship to prisoner John Smith)',
        DeleteRelationshipPage,
        false,
        'John Smith',
        'First Middle Names Last',
      )
      .selectBlockedAction('GO_TO_CONTACT_LIST')
      .clickButtonTo('Continue', ListContactsPage, 'John Smith')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      0,
    )
  })

  xit('Cannot delete the relationship if it has relationship restrictions, return to contact record', () => {
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [TestData.getPrisonerContactRestrictionDetails()],
        contactGlobalRestrictions: [],
      },
    })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo(
        'Delete relationship (Relationship to prisoner John Smith)',
        DeleteRelationshipPage,
        false,
        'John Smith',
        'First Middle Names Last',
      )
      .selectBlockedAction('GO_TO_CONTACT_RECORD')
      .clickButtonTo('Continue', ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      0,
    )
  })

  xit('Back link goes back to which ever page you came from', () => {
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo(
        'Delete relationship (Relationship to prisoner John Smith)',
        DeleteRelationshipPage,
        true,
        'John Smith',
        'First Middle Names Last',
      )
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
      .clickLinkTo('Edit contact details', EditContactDetailsPage, 'First Middle Names Last')
      .clickLinkTo(
        'Delete relationship (Relationship to prisoner John Smith)',
        DeleteRelationshipPage,
        true,
        'John Smith',
        'First Middle Names Last',
      )
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
  })

  xit('Cancel goes back to manage contact', () => {
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickLinkTo(
        'Delete relationship (Relationship to prisoner John Smith)',
        DeleteRelationshipPage,
        true,
        'John Smith',
        'First Middle Names Last',
      )
      .clickButtonTo('No, do not delete', ManageContactDetailsPage, 'First Middle Names Last')
  })
})
