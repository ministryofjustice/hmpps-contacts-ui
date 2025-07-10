import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipStatusPage from '../pages/contact-details/relationship/selectRelationshipStatusPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Manage contact update relationship status active', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({ prisonerContactId }),
    })

    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
    })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can update relationship status active', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowRelationshipStatusAs('Active')
      .clickChangeRelationshipStatusLink()

    Page.verifyOnPage(SelectRelationshipStatusPage, 'First Middle Names Last', 'John Smith') //
      .selectIsRelationshipActive('NO')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      { isRelationshipActive: false },
    )
  })

  it('goes to correct page on Back or Cancel', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipStatusLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(SelectRelationshipStatusPage, 'First Middle Names Last', 'John Smith') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .clickChangeRelationshipStatusLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(SelectRelationshipStatusPage, 'First Middle Names Last', 'John Smith') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('should show hint text when contact is an approved visitor with active relationship', () => {
    // Stub the relationship to be active and approved visitor
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        isApprovedVisitor: true,
        isRelationshipActive: true,
      }),
    })

    // Visit the page
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeRelationshipStatusLink()

    Page.verifyOnPage(SelectRelationshipStatusPage, 'First Middle Names Last', 'John Smith') //
      .verifyHintText(
        'Setting the relationship status to inactive will not remove First Middle Names Last from the prisoner’s approved visitors list in the visits booking service.If you no longer want this contact to be listed in the visits booking service, a DPS user with Contacts Authoriser access will need to remove visits approval.',
      )
  })
})
