import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ViewAllAddressesPage from '../pages/viewAllAddressesPage'
import SelectAddressTypePage from '../pages/selectAddressTypePage'

context('Add Address', () => {
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
    cy.task('stubAddressTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickViewAllAddressesLink()
  })

  it('Can add address for a contact', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressButton()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .isEmptyForm()
      .selectAddressType('HOME')

    // TODO next pages
  })

  it(`Back link goes to manage contacts`, () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressButton()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .backTo(ViewAllAddressesPage, 'First Middle Names Last')
  })
})
