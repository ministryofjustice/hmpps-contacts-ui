import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipStatusPage from '../pages/contact-details/relationship/selectRelationshipStatusPage'
import EditContactDetailsPage from '../pages/editContactDetailsPage'

context('Manage contact update relationship status active with Authoriser role', () => {
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
    cy.task('stubSignIn', { roles: ['CONTACTS_ADMINISTRATOR', 'CONTACTS_AUTHORISER'] })
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

  it('should show hint text for CONTACTS_AUTHORISER when contact is an approved visitor with active relationship', () => {
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
        'Setting the relationship status to inactive will not remove First Middle Names Last from John Smith’s approved visitors list in the visits booking service. If this contact should not be on the prisoner’s approved visitor list, you’ll need to remove visits approval.',
      )
  })
})
