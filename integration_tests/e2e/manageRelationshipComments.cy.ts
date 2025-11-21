import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactDetailsPage from '../pages/editContactDetailsPage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'

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
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can update a comments for a contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowCommentsAs('Some existing comments')
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
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
      { comments: 'my comments' },
    )
  })

  it('Can remove comments for a contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .verifyComments('Some existing comments')
      .clearComments()
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner(
        'You’ve updated the relationship information for contact First Middle Names Last and prisoner John Smith.',
      )

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      { comments: null },
    )
  })

  it(`Relationship comments must be less than 240 characters`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .verifyShowCommentsAs('Some existing comments')
      .clickChangeCommentsLink()

    const commentsPage = Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .enterComments(''.padEnd(241))
      .continueTo(RelationshipCommentsPage, 'First Middle Names Last', 'John Smith')
    commentsPage.hasFieldInError('comments', 'Comments must be 240 characters or less')
  })

  it('goes to correct page on Back or Cancel', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()

    Page.verifyOnPage(EditContactDetailsPage, 'First Middle Names Last') //
      .clickChangeCommentsLink()

    // Back to Edit Contact Details
    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .backTo(EditContactDetailsPage, 'First Middle Names Last')
      .clickChangeCommentsLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last', 'John Smith') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
