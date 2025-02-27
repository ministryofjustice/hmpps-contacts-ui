import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import ManageRelationshipCommentsPage from '../pages/contact-details/relationship/manageRelationshipCommentsPage'

context('Manage contact update comments for a contact', () => {
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
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship({
        prisonerContactId,
        comments: 'Some existing comments',
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

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can update a comments for a contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowCommentsAs('Some existing comments')
      .clickChangeCommentsLink()

    Page.verifyOnPage(ManageRelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .enterComments('my comments')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner(
        'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
      )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      { comments: 'my comments', updatedBy: 'USER1' },
    )
  })

  it(`Relationship comments must be less than 240 characters`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowCommentsAs('Some existing comments')
      .clickChangeCommentsLink()

    const commentsPage = Page.verifyOnPage(ManageRelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .enterComments(''.padEnd(241))
      .continueTo(ManageRelationshipCommentsPage, 'First Middle Names Last', 'John Smith')
    commentsPage.hasFieldInError('comments', 'Comments must be 240 characters or less')
  })

  it('goes to correct page on Back or Cancel', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeCommentsLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(ManageRelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .clickChangeCommentsLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(ManageRelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
