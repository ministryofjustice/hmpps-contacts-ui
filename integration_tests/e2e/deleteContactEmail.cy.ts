import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ConfirmDeleteEmailPage from '../pages/confirmDeleteEmailPage'

context('Delete Contact Email', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    emailAddresses: [
      TestData.getContactEmailDetails('first@example.com', 123),
      TestData.getContactEmailDetails('last@example.com', 777),
    ],
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

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can delete a contact email address', () => {
    cy.task('stubDeleteContactEmail', { contactId, contactEmailId: 123 })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteEmailLink(123)

    Page.verifyOnPage(ConfirmDeleteEmailPage) //
      .hasEmailAddress('first@example.com')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/email/123`,
      },
      1,
    )
  })

  it('Can cancel deleting a contact email address', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickDeleteEmailLink(777)

    Page.verifyOnPage(ConfirmDeleteEmailPage) //
      .hasEmailAddress('last@example.com')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyAPIWasCalled(
      {
        method: 'DELETE',
        urlPath: `/contact/${contactId}/email/777`,
      },
      0,
    )
  })
})
