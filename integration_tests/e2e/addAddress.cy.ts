import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectAddressTypePage from '../pages/contact-methods/address/selectAddressTypePage'
import EnterAddressPage from '../pages/contact-methods/address/enterAddressPage'
import AddressCheckYourAnswersPage from '../pages/addressCheckYourAnswersPage'
import { StubPrisonApiAddress } from '../mockApis/prisonApi'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import EnterAddressDatesPage from '../pages/contact-methods/address/enterAddressDatesPage'
import SelectAddressFlagsPage from '../pages/contact-methods/address/selectAddressFlagsPage'
import EnterAddressCommentsPage from '../pages/contact-methods/address/enterAddressCommentsPage'

context('Add Address', () => {
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
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubAddressTypeReferenceData')
    cy.task('stubCityReferenceData')
    cy.task('stubCountyReferenceData')
    cy.task('stubCountryReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()
  })

  it('Can add address for a contact with all fields populated', () => {
    cy.task('stubCreateContactAddress', {
      contactId,
      created: {
        contactAddressId: 123987,
      },
    })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressLink()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .isEmptyForm()
      .selectAddressType('HOME')
      .continueTo(EnterAddressPage, 'First Middle Names Last') //
      .verifyCanNotUsePrisonerAddress()
      .clickNoFixedAddress()
      .enterFlat('1A')
      .enterPremises('The Block')
      .enterStreet('My Street')
      .enterLocality('Downtown')
      .selectTown('Exeter')
      .selectCounty('Devon')
      .enterPostcode('P05T C0D3')
      .selectCountry('England')
      .continueTo(EnterAddressDatesPage, 'First Middle Names Last') //
      .enterFromMonth('09')
      .enterFromYear('2009')
      .enterToMonth('10')
      .enterToYear('2010')
      .continueTo(SelectAddressFlagsPage, 'First Middle Names Last')
      .selectIsPrimaryOrPostal('P')
      .continueTo(EnterAddressCommentsPage)
      .enterComments('Something about the address')
      .clickContinue()

    Page.verifyOnPage(AddressCheckYourAnswersPage, 'home address', 'First Middle Names Last') //
      .verifyShowsAddressTypeAs('Home address')
      .verifyShowsAddressAs('1A<br>The Block<br>My Street<br>Downtown<br>Exeter<br>Devon<br>P05T C0D3<br>England')
      .verifyShowsNoFixedAddressAs('Yes')
      .verifyShowsFromDateAs('September 2009')
      .verifyShowsToDateAs('October 2010')
      .verifyShowsPrimaryAddressAs('Yes')
      .verifyShowsMailAddressAs('No')
      .verifyShowsCommentsAs('Something about the address')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/address`,
      },
      {
        addressType: 'HOME',
        flat: '1A',
        property: 'The Block',
        street: 'My Street',
        area: 'Downtown',
        cityCode: '7375',
        countyCode: 'DEVON',
        postcode: 'P05T C0D3',
        countryCode: 'ENG',
        verified: false,
        primaryAddress: true,
        mailFlag: false,
        startDate: '2009-09-01T00:00:00.000Z',
        endDate: '2010-10-01T00:00:00.000Z',
        noFixedAddress: true,
        comments: 'Something about the address',
        createdBy: 'USER1',
      },
    )
  })

  it('Can add address for a contact with minimal fields populated', () => {
    cy.task('stubCreateContactAddress', {
      contactId,
      created: {
        contactAddressId: 123987,
      },
    })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressLink()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .isEmptyForm()
      .selectAddressType('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(EnterAddressPage, 'First Middle Names Last') //
      .verifyCanNotUsePrisonerAddress()
      .selectCountry('England')
      .continueTo(EnterAddressDatesPage, 'First Middle Names Last')
      .enterFromMonth('09')
      .enterFromYear('2009')
      .continueTo(SelectAddressFlagsPage, 'First Middle Names Last')
      .continueTo(EnterAddressCommentsPage)
      .clickContinue()

    Page.verifyOnPage(AddressCheckYourAnswersPage, 'address', 'First Middle Names Last') //
      .verifyShowsAddressTypeAs('Not provided')
      .verifyShowsAddressAs('England')
      .verifyShowsNoFixedAddressAs('No')
      .verifyShowsFromDateAs('September 2009')
      .verifyShowsToDateAs('Not provided')
      .verifyShowsPrimaryAddressAs('Not provided')
      .verifyShowsMailAddressAs('Not provided')
      .verifyShowsCommentsAs('Not provided')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/address`,
      },
      {
        countryCode: 'ENG',
        verified: false,
        startDate: '2009-09-01T00:00:00.000Z',
        noFixedAddress: false,
        createdBy: 'USER1',
      },
    )
  })

  it('Can use prisoner address', () => {
    cy.task('stubCreateContactAddress', {
      contactId,
      created: {
        contactAddressId: 123987,
      },
    })
    cy.task(
      'stubPrisonerById',
      TestData.prisoner({
        addresses: [
          {
            fullAddress: '12, not used, england',
            primaryAddress: true,
          },
        ],
      }),
    )
    const prisonerAddress: StubPrisonApiAddress = {
      addressId: 1,
      addressType: 'foo',
      primary: true,
      mail: true,
      noFixedAddress: true,
      flat: 'Prisoner Flat',
      premise: 'Prisoner Premises',
      street: 'Prisoner Street',
      locality: 'Prisoner Locality',
      town: 'Ilfracombe',
      townCode: '7521',
      county: 'West Sussex',
      countyCode: 'W.SUSSEX',
      postalCode: 'PPCODE',
      country: 'Wales',
      countryCode: 'WALES',
    }
    cy.task('stubOffenderAddresses', { prisonerNumber, addresses: [prisonerAddress] })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressLink()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .selectAddressType('DO_NOT_KNOW')
      .continueTo(EnterAddressPage, 'First Middle Names Last')
      .clickUsePrisonerAddress()

    Page.verifyOnPage(EnterAddressPage, 'First Middle Names Last') //
      .hasFlat('Prisoner Flat')
      .hasPremises('Prisoner Premises')
      .hasStreet('Prisoner Street')
      .hasLocality('Prisoner Locality')
      .hasTown('Ilfracombe')
      .hasCounty('West Sussex')
      .hasPostcode('PPCODE')
      .hasCountry('Wales')
  })

  it('Can change answers', () => {
    cy.task('stubCreateContactAddress', {
      contactId,
      created: {
        contactAddressId: 123987,
      },
    })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressLink()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .isEmptyForm()
      .selectAddressType('HOME')
      .continueTo(EnterAddressPage, 'First Middle Names Last') //
      .clickNoFixedAddress()
      .enterFlat('1A')
      .enterPremises('The Block')
      .enterStreet('My Street')
      .enterLocality('Downtown')
      .selectTown('Exeter')
      .selectCounty('Devon')
      .enterPostcode('P05T C0D3')
      .selectCountry('England')
      .continueTo(EnterAddressDatesPage, 'First Middle Names Last') //
      .enterFromMonth('09')
      .enterFromYear('2009')
      .enterToMonth('10')
      .enterToYear('2010')
      .continueTo(SelectAddressFlagsPage, 'First Middle Names Last') //
      .selectIsPrimaryOrPostal('P')
      .continueTo(EnterAddressCommentsPage) //
      .enterComments('Something about the address')
      .clickContinue()

    Page.verifyOnPage(AddressCheckYourAnswersPage, 'home address', 'First Middle Names Last') //
      .verifyShowsAddressTypeAs('Home address')
      .verifyShowsAddressAs('1A<br>The Block<br>My Street<br>Downtown<br>Exeter<br>Devon<br>P05T C0D3<br>England')
      .verifyShowsNoFixedAddressAs('Yes')
      .verifyShowsFromDateAs('September 2009')
      .verifyShowsToDateAs('October 2010')
      .verifyShowsPrimaryAddressAs('Yes')
      .verifyShowsMailAddressAs('No')
      .verifyShowsCommentsAs('Something about the address')
      .clickChangeAddressTypeLink()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .hasAddressType('HOME')
      .selectAddressType('WORK')
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsAddressTypeAs('Work address')
      .clickChangeAddressLink()

    Page.verifyOnPage(EnterAddressPage, 'First Middle Names Last') //
      .hasFlat('1A')
      .hasPremises('The Block')
      .hasStreet('My Street')
      .hasLocality('Downtown')
      .hasTown('Exeter')
      .hasCounty('Devon')
      .hasPostcode('P05T C0D3')
      .hasCountry('England')
      .enterFlat('2B')
      .enterPremises('Another Block')
      .enterStreet('Another Street')
      .enterLocality('Uptown')
      .selectTown('Sheffield')
      .selectCounty('South Yorkshire')
      .enterPostcode('POBOX1')
      .selectCountry('Scotland')
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsAddressAs(
        '2B<br>Another Block<br>Another Street<br>Uptown<br>Sheffield<br>South Yorkshire<br>POBOX1<br>Scotland',
      )
      .clickChangeNoFixedAddressLink()

    Page.verifyOnPage(EnterAddressPage, 'First Middle Names Last') //
      .clickNoFixedAddress()
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsNoFixedAddressAs('No')
      .clickChangeFromDateLink()

    Page.verifyOnPage(EnterAddressDatesPage, 'First Middle Names Last') //
      .hasFromMonth('9')
      .hasFromYear('2009')
      .enterFromMonth('10')
      .enterFromYear('2010')
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsFromDateAs('October 2010')
      .clickChangeToDateLink()

    Page.verifyOnPage(EnterAddressDatesPage, 'First Middle Names Last') //
      .hasToMonth('10')
      .hasToYear('2010')
      .enterToMonth('11')
      .enterToYear('2011')
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsToDateAs('November 2011')
      .clickChangePrimaryAddressLink()

    Page.verifyOnPage(SelectAddressFlagsPage, 'First Middle Names Last') //
      .verifyIsPrimaryOrPostalAnswer('P')
      .selectIsPrimaryOrPostal('M')
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsPrimaryAddressAs('No')
      .verifyShowsMailAddressAs('Yes')
      .clickChangeCommentsLink()

    Page.verifyOnPage(EnterAddressCommentsPage) //
      .hasComments('Something about the address')
      .enterComments('Updated comments')
      .continueTo(AddressCheckYourAnswersPage, 'work address', 'First Middle Names Last')
      .verifyShowsCommentsAs('Updated comments')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/address`,
      },
      {
        addressType: 'WORK',
        flat: '2B',
        property: 'Another Block',
        street: 'Another Street',
        area: 'Uptown',
        cityCode: '25343',
        countyCode: 'S.YORKSHIRE',
        postcode: 'POBOX1',
        countryCode: 'SCOT',
        verified: false,
        primaryAddress: false,
        mailFlag: true,
        startDate: '2010-10-01T00:00:00.000Z',
        endDate: '2011-11-01T00:00:00.000Z',
        noFixedAddress: false,
        comments: 'Updated comments',
        createdBy: 'USER1',
      },
    )
  })

  it(`Back link goes to manage contacts`, () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressLink()

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
