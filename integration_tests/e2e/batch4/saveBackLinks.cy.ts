import Page from '../../pages/page'
import TestData from '../../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../../pages/manageContactDetails'
import SelectApprovedVisitorPage from '../../pages/contact-details/relationship/selectApprovedVisitorPage'
import pagedPrisonerAlertsData from '../../../server/testutils/testPrisonerAlertsData'

context('Save backlinks back to DPS prisoner profile', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
  })
  const { prisonerNumber } = TestData.prisoner()

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_AUTHORISER'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        isApprovedVisitor: true,
      }),
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
    cy.task('stubGetContactHistory', { contactId, history: [] })
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.task(
      'stubPrisonerAlertsById',
      pagedPrisonerAlertsData({
        prisonNumber: prisonerNumber,
      }),
    )

    cy.signIn()
  })

  it('should handle /save-backlink to contact details redirect, show back link in banner and remove link when context changes', () => {
    // Call URL that DPS Prisoner Profile gives for changing next of kin details
    cy.visit(
      `/save-backlink?service=prisoner-profile&returnPath=/prisoner/${prisonerNumber}/personal%23next-of-kin&redirectPath=/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    )

    // Should be redirected to contact details page
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickApproveVisitLink()

    // Make a change - back link to DPS prisoner profile should be in success banner
    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Middle Names Last', 'John Smith') //
      .selectIsApprovedVisitor('NO')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner(
        'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
      )
      .hasSavedBackLink('Back to John Smith’s profile', 'http://localhost:9091/prisoner/A1234BC/personal#next-of-kin')

    // Saved back link persists multiple changes
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickApproveVisitLink()
    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Middle Names Last', 'John Smith') //
      .selectIsApprovedVisitor('YES')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner(
        'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
      )
      .hasSavedBackLink('Back to John Smith’s profile', 'http://localhost:9091/prisoner/A1234BC/personal#next-of-kin')

    // Visiting a page outside this prisoner/contact context should clear saved back link
    cy.visit('/start')

    // Return to contact details page
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    // No back link in success banner now when making a change
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickApproveVisitLink()
    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Middle Names Last', 'John Smith') //
      .selectIsApprovedVisitor('NO')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner(
        'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
      )
      .hasNoSavedBackLink()
  })
})
