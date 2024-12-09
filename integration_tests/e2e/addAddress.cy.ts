import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import ViewAllAddressesPage from '../pages/viewAllAddressesPage'
import SelectAddressTypePage from '../pages/selectAddressTypePage'
import EnterAddressPage from '../pages/enterAddressPage'
import EnterAddressMetadataPage from '../pages/enterAddressMetadataPage'

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
    cy.task('stubCityReferenceData')
    cy.task('stubCountyReferenceData')
    cy.task('stubCountryReferenceData')
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickViewAllAddressesLink()
  })

  it('Can add address for a contact', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressButton()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .isEmptyForm()
      .selectAddressType('HOME')
      .clickContinue()

    Page.verifyOnPage(EnterAddressPage, 'home address', 'First Middle Names Last') //
      .clickNoFixedAddress()
      .enterFlat('Flat 1')
      .enterPremises('The Block')
      .enterStreet('My Street')
      .enterLocality('Downtown')
      .selectTown('Exeter')
      .selectCounty('Devon')
      .selectCountry('England')
      .clickContinue()

    Page.verifyOnPage(EnterAddressMetadataPage, 'home address', 'First Middle Names Last') //
      .enterFromMonth('09')
      .enterFromYear('2009')
      .enterToMonth('10')
      .enterToYear('2010')
      .selectPrimaryAddress('Yes')
      .selectMailAddress('No')
      .enterComments('Something about the address')

    // TODO CYA page
  })

  it(`Back link goes to manage contacts`, () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressButton()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .backTo(ViewAllAddressesPage, 'First Middle Names Last')
  })
})
