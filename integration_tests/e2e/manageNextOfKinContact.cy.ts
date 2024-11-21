import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectNextOfKinContactPage from '../pages/selectNextOfKinPage'

context('Manage contact update next of kin contact', () => {
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
      response: { isNextOfKin: false },
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can update next of kin', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickEditNextOfKinContactLink()

    Page.verifyOnPage(SelectNextOfKinContactPage, 'First Middle Names Last') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').verifyShowIsNextOfKinContactAs('Yes')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/prisoner-contact/${prisonerContactId}`,
      },
      { isNextOfKin: false, updatedBy: 'USER1' },
    )
  })

  it(`Back link goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickEditNextOfKinContactLink()

    Page.verifyOnPage(SelectNextOfKinContactPage, 'First Middle Names Last') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it(`Cancel goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickEditNextOfKinContactLink()

    Page.verifyOnPage(SelectNextOfKinContactPage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
