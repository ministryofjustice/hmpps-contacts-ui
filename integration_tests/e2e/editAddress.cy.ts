import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectAddressTypePage from '../pages/contact-methods/address/selectAddressTypePage'
import EnterAddressPage from '../pages/contact-methods/address/enterAddressPage'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import EnterAddressDatesPage from '../pages/contact-methods/address/enterAddressDatesPage'
import SelectAddressFlagsPage from '../pages/contact-methods/address/selectAddressFlagsPage'
import EnterAddressCommentsPage from '../pages/contact-methods/address/enterAddressCommentsPage'

context('Edit Address', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contactAddressId = 888666
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
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
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

    const address = TestData.address({
      contactId,
      contactAddressId,
      addressType: null,
      addressTypeDescription: null,
      flat: 'F1',
      property: '24',
      street: 'Acacia Avenue',
      area: 'Bunting',
      cityCode: '25343',
      cityDescription: 'Sheffield',
      countyCode: 'S.YORKSHIRE',
      countyDescription: 'South Yorkshire',
      postcode: 'S2 3LK',
      countryCode: 'ENG',
      countryDescription: 'England',
      verified: false,
      verifiedBy: null,
      verifiedTime: null,
      primaryAddress: false,
      mailFlag: false,
      startDate: '2020-01-02',
      endDate: '2076-04-06',
      noFixedAddress: false,
      comments: 'Some comments',
    })
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      addresses: [address],
    })

    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubUpdateContactAddress', {
      contactId,
      contactAddressId,
      updated: {
        contactAddressId,
      },
    })

    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()
  })

  it('Can update address type', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressTypeLink(contactAddressId)

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last', true) //
      .hasAddressType('DO_NOT_KNOW')
      .selectAddressType('WORK')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        addressType: 'WORK',
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update address lines', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressLinesLink(contactAddressId)

    Page.verifyOnPage(EnterAddressPage, 'First Middle Names Last', true) //
      .hasFlat('F1')
      .hasPremises('24')
      .hasStreet('Acacia Avenue')
      .hasLocality('Bunting')
      .hasTown('Sheffield')
      .hasCounty('South Yorkshire')
      .hasPostcode('S2 3LK')
      .hasCountry('England')
      .clickNoFixedAddress()
      .enterFlat('1A')
      .enterPremises('Tower Block')
      .enterStreet('My Street')
      .enterLocality('Downtown')
      .selectTown('Exeter') // code: 7375
      .selectCounty('Devon') // code: DEVON
      .enterPostcode('P1')
      .selectCountry('Scotland') // code: SCOT
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        noFixedAddress: true,
        flat: '1A',
        property: 'Tower Block',
        street: 'My Street',
        area: 'Downtown',
        cityCode: '7375',
        countyCode: 'DEVON',
        postcode: 'P1',
        countryCode: 'SCOT',
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can remove optional address lines', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressLinesLink(contactAddressId)

    Page.verifyOnPage(EnterAddressPage, 'First Middle Names Last', true) //
      .hasFlat('F1')
      .hasPremises('24')
      .hasStreet('Acacia Avenue')
      .hasLocality('Bunting')
      .hasTown('Sheffield')
      .hasCounty('South Yorkshire')
      .hasPostcode('S2 3LK')
      .hasCountry('England')
      .clickNoFixedAddress()
      .clearFlat()
      .clearPremises()
      .clearStreet()
      .clearLocality()
      .clearTown()
      .clearCounty()
      .clearPostcode()
      .selectCountry('Scotland')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        noFixedAddress: true,
        flat: null,
        property: null,
        street: null,
        area: null,
        cityCode: null,
        countyCode: null,
        postcode: null,
        countryCode: 'SCOT',
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update address dates', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressDatesLink(contactAddressId)

    Page.verifyOnPage(EnterAddressDatesPage, 'First Middle Names Last', true) //
      .hasFromMonth('1')
      .hasFromYear('2020')
      .hasToMonth('4')
      .hasToYear('2076')
      .enterFromMonth('09')
      .enterFromYear('2009')
      .enterToMonth('12')
      .enterToYear('2077')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        startDate: '2009-09-01T00:00:00.000Z',
        endDate: '2077-12-01T00:00:00.000Z',
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can remove optional end dates', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressDatesLink(contactAddressId)

    Page.verifyOnPage(EnterAddressDatesPage, 'First Middle Names Last', true) //
      .hasFromMonth('1')
      .hasFromYear('2020')
      .hasToMonth('4')
      .hasToYear('2076')
      .clearToMonth()
      .clearToYear()
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        startDate: '2020-01-01T00:00:00.000Z',
        endDate: null,
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update address flags', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressFlagsLink(contactAddressId)

    Page.verifyOnPage(SelectAddressFlagsPage, 'First Middle Names Last', true) //
      .verifyIsPrimaryOrPostalAnswer('NONE')
      .selectIsPrimaryOrPostal('PM')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        primaryAddress: true,
        mailFlag: true,
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update address comments', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressCommentsLink(contactAddressId)

    Page.verifyOnPage(EnterAddressCommentsPage, 'First Middle Names Last', true) //
      .hasComments('Some comments')
      .enterComments('new text')
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        comments: 'new text',
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })

  it('Can remove address comments', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressCommentsLink(contactAddressId)

    Page.verifyOnPage(EnterAddressCommentsPage, 'First Middle Names Last', true) //
      .hasComments('Some comments')
      .clearComments()
      .continueTo(ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'PATCH',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        comments: null,
        verified: false,
        updatedBy: 'USER1',
      },
    )
  })
})
