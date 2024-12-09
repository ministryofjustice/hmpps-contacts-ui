import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ViewAllAddressesPage from '../pages/viewAllAddressesPage'

context('Manage contact view all addresses for a contact', () => {
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

  it('Can view all addresses for a contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickViewAllAddressesLink()

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
  })

  it(`Back link goes to manage contacts`, () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickViewAllAddressesLink()

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
