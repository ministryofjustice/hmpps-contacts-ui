import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'

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
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubUpdateContactRelationshipById', {
      prisonerContactId,
      response: { comments: 'my comments' },
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
      .clickEditRelationshipCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last') //
      .enterComments('my comments')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').verifyShowIsRelationshipCommentsAs(
      'Some comments',
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
      .clickEditRelationshipCommentsLink()

    const commentsPage = Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last') //
      .enterComments(''.padEnd(241))
      .continueTo(RelationshipCommentsPage, 'First Middle Names Last')
    commentsPage.hasFieldInError('comments', 'Additional information must be 240 characters or less')
  })

  it(`Back link goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()
      .clickEditRelationshipCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it(`Cancel goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditContactDetailsLink()
      .clickEditRelationshipCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
