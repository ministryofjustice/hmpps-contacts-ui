import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectAddressTypePage from '../pages/contact-methods/address/selectAddressTypePage'
import EnterAddressPage from '../pages/enterAddressPage'
import EnterAddressMetadataPage from '../pages/enterAddressMetadataPage'
import EditContactMethodsPage from '../pages/editContactMethodsPage'

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
    cy.signIn()
  })

  it('Can update address for a contact with all fields populated', () => {
    const address = TestData.address({
      contactId,
      contactAddressId,
      addressType: 'HOME',
      addressTypeDescription: 'Home address',
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
      endDate: '2025-04-06',
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
    cy.task('stubUpdateContactAddress', {
      contactId,
      contactAddressId,
      updated: {
        contactAddressId,
      },
    })

    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressLink(contactAddressId)

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .hasAddressType('HOME')
      .selectAddressType('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(EnterAddressPage, 'address', 'First Middle Names Last') //
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
      .clickContinue()

    Page.verifyOnPage(EnterAddressMetadataPage, 'address', 'First Middle Names Last') //
      .hasPrimaryAddress('No')
      .hasMailAddress('No')
      .hasFromMonth('1')
      .hasFromYear('2020')
      .hasToMonth('4')
      .hasToYear('2025')
      .hasComments('Some comments')
      .enterFromMonth('09')
      .enterFromYear('2009')
      .clearToMonth()
      .clearToYear()
      .selectPrimaryAddress('Yes')
      .selectMailAddress('Yes')
      .clearComments()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        noFixedAddress: true,
        countryCode: 'SCOT',
        verified: false,
        primaryAddress: true,
        mailFlag: true,
        startDate: '2009-09-01T00:00:00.000Z',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update address for a contact with minimal fields populated', () => {
    const address = TestData.address({
      contactId,
      contactAddressId,
      addressType: null,
      addressTypeDescription: null,
      flat: null,
      property: null,
      street: null,
      area: null,
      cityCode: null,
      cityDescription: null,
      countyCode: null,
      countyDescription: null,
      postcode: null,
      countryCode: 'ENG',
      countryDescription: 'England',
      verified: false,
      verifiedBy: null,
      verifiedTime: null,
      primaryAddress: true,
      mailFlag: true,
      startDate: '2020-01-02',
      noFixedAddress: true,
      comments: null,
    })
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      addresses: [address],
    })

    cy.task('stubGetContactById', contact)
    cy.task('stubUpdateContactAddress', {
      contactId,
      contactAddressId,
      updated: {
        contactAddressId,
      },
    })

    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressLink(contactAddressId)

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .hasAddressType('DO_NOT_KNOW')
      .selectAddressType('WORK')
      .clickContinue()

    Page.verifyOnPage(EnterAddressPage, 'work address', 'First Middle Names Last') //
      .hasFlat('')
      .hasPremises('')
      .hasStreet('')
      .hasLocality('')
      .hasTown('')
      .hasCounty('')
      .hasPostcode('')
      .hasCountry('England')
      .clickNoFixedAddress()
      .enterFlat('1A')
      .enterPremises('Tower Block')
      .enterStreet('My Street')
      .enterLocality('Downtown')
      .selectTown('Exeter')
      .selectCounty('Devon')
      .enterPostcode('P1')
      .selectCountry('Scotland')
      .clickContinue()

    Page.verifyOnPage(EnterAddressMetadataPage, 'work address', 'First Middle Names Last') //
      .hasPrimaryAddress('Yes')
      .hasMailAddress('Yes')
      .hasFromMonth('1')
      .hasFromYear('2020')
      .hasToMonth('')
      .hasToYear('')
      .hasComments('')
      .enterFromMonth('09')
      .enterFromYear('2009')
      .enterToMonth('12')
      .enterToYear('2012')
      .selectPrimaryAddress('No')
      .selectMailAddress('No')
      .enterComments('New comments')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        addressType: 'WORK',
        flat: '1A',
        property: 'Tower Block',
        street: 'My Street',
        area: 'Downtown',
        cityCode: '7375',
        countyCode: 'DEVON',
        postcode: 'P1',
        countryCode: 'SCOT',
        verified: false,
        primaryAddress: false,
        mailFlag: false,
        startDate: '2009-09-01T00:00:00.000Z',
        endDate: '2012-12-01T00:00:00.000Z',
        noFixedAddress: false,
        comments: 'New comments',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can update an expired address', () => {
    const address = TestData.address({
      contactId,
      contactAddressId,
      addressType: null,
      addressTypeDescription: null,
      flat: null,
      property: null,
      street: null,
      area: null,
      cityCode: null,
      cityDescription: null,
      countyCode: null,
      countyDescription: null,
      postcode: null,
      countryCode: 'ENG',
      countryDescription: 'England',
      verified: false,
      verifiedBy: null,
      verifiedTime: null,
      primaryAddress: true,
      mailFlag: true,
      startDate: '2020-01-02',
      endDate: '2021-02-03',
      noFixedAddress: true,
      comments: null,
    })
    const contact = TestData.contact({
      id: contactId,
      lastName: 'Last',
      firstName: 'First',
      middleNames: 'Middle Names',
      addresses: [address],
    })

    cy.task('stubGetContactById', contact)
    cy.task('stubUpdateContactAddress', {
      contactId,
      contactAddressId,
      updated: {
        contactAddressId,
      },
    })

    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickViewPreviousAddresses()
      .clickChangeAddressLink(contactAddressId)

    Page.verifyOnPage(SelectAddressTypePage, 'First Middle Names Last') //
      .hasAddressType('DO_NOT_KNOW')
      .selectAddressType('WORK')
      .clickContinue()

    Page.verifyOnPage(EnterAddressPage, 'work address', 'First Middle Names Last') //
      .hasFlat('')
      .hasPremises('')
      .hasStreet('')
      .hasLocality('')
      .hasTown('')
      .hasCounty('')
      .hasPostcode('')
      .hasCountry('England')
      .clickNoFixedAddress()
      .enterFlat('1A')
      .enterPremises('Tower Block')
      .enterStreet('My Street')
      .enterLocality('Downtown')
      .selectTown('Exeter')
      .selectCounty('Devon')
      .enterPostcode('P1')
      .selectCountry('Scotland')
      .clickContinue()

    Page.verifyOnPage(EnterAddressMetadataPage, 'work address', 'First Middle Names Last') //
      .hasPrimaryAddress('Yes')
      .hasMailAddress('Yes')
      .hasFromMonth('1')
      .hasFromYear('2020')
      .hasToMonth('2')
      .hasToYear('2021')
      .hasComments('')
      .enterFromMonth('09')
      .enterFromYear('2009')
      .enterToMonth('12')
      .enterToYear('2012')
      .selectPrimaryAddress('No')
      .selectMailAddress('No')
      .enterComments('New comments')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/address/${contactAddressId}`,
      },
      {
        addressType: 'WORK',
        flat: '1A',
        property: 'Tower Block',
        street: 'My Street',
        area: 'Downtown',
        cityCode: '7375',
        countyCode: 'DEVON',
        postcode: 'P1',
        countryCode: 'SCOT',
        verified: false,
        primaryAddress: false,
        mailFlag: false,
        startDate: '2009-09-01T00:00:00.000Z',
        endDate: '2012-12-01T00:00:00.000Z',
        noFixedAddress: false,
        comments: 'New comments',
        updatedBy: 'USER1',
      },
    )
  })
})
