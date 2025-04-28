import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import AddAddressPhonesPage from '../pages/contact-methods/address/phone/addAddressPhonesPage'

context('Create Address Phones', () => {
  const contactId = 654321
  const prisonerContactId = 98764
  const contactAddressId = 555666
  const phoneOne = TestData.getAddressPhoneNumberDetails('MOB', 'Mobile', '07878 111111', 1)
  const phoneTwo = TestData.getAddressPhoneNumberDetails('HOME', 'Home', '01111 777777', 2)
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [phoneOne, phoneTwo],
    addresses: [
      TestData.address({
        contactAddressId,
        phoneNumbers: [phoneTwo],
      }),
    ],
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
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
    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({
      startUrl: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`,
    })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()
  })

  it('Can create multiple phone numbers', () => {
    cy.task('stubCreateAddressPhones', { contactId, contactAddressId })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    Page.verifyOnPage(AddAddressPhonesPage, true) //
      .enterPhoneNumber(0, '01234 777777')
      .enterExtension(0, '000')
      .selectType(0, 'HOME')
      .clickAddAnotherButton()
      .enterPhoneNumber(1, 'to be deleted')
      .clickAddAnotherButton()
      .enterPhoneNumber(2, '01234 777776')
      .selectType(2, 'HOME')
      .clickRemoveButton(1)
      .clickButtonTo('Confirm and save', ManageContactDetailsPage, 'First Middle Names Last')
      .hasSuccessBanner('You’ve updated the contact methods for First Middle Names Last.')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phones`,
      },
      {
        phoneNumbers: [
          {
            phoneType: 'HOME',
            phoneNumber: '01234 777777',
            extNumber: '000',
          },
          {
            phoneType: 'HOME',
            phoneNumber: '01234 777776',
          },
        ],
      },
    )
  })

  it('Should keep details of other phone numbers if a different one has an error', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    const addAddressPhonesPage = Page.verifyOnPage(AddAddressPhonesPage, true) //
      .enterPhoneNumber(0, '01234 777777')
      .enterExtension(0, '000')
      .selectType(0, 'HOME')
      .clickAddAnotherButton()
      .enterPhoneNumber(1, 'a'.repeat(100))

    addAddressPhonesPage.clickContinue()
    addAddressPhonesPage.hasFieldInError('phones[1].type', 'Select the type of phone number')
    addAddressPhonesPage.hasFieldInError('phones[1].phoneNumber', 'Phone number must be 20 characters or less')

    addAddressPhonesPage //
      .hasType(0, 'HOME')
      .hasPhoneNumber(0, '01234 777777')
      .hasExtension(0, '000')
      .hasType(1, '')
      .hasPhoneNumber(1, 'a'.repeat(100))
      .hasExtension(1, '')
  })

  it('Should validate inputs', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    // require phone number type
    const enterPhonePage = Page.verifyOnPage(AddAddressPhonesPage, true) //
      .enterPhoneNumber(0, '01234 777777')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phones[0].type', 'Select the type of phone number')

    // require phone number
    enterPhonePage.clearPhoneNumber(0).selectType(0, 'HOME').clickContinue()
    enterPhonePage.hasFieldInError('phones[0].phoneNumber', 'Enter a phone number')

    // require phone number is 20 chars or fewer
    enterPhonePage.enterPhoneNumber(0, ''.padEnd(21, '0')).clickContinue()
    enterPhonePage.hasFieldInError('phones[0].phoneNumber', 'Phone number must be 20 characters or less')

    // require extension is 7 chars or fewer
    enterPhonePage.enterPhoneNumber(0, '0123').enterExtension(0, ''.padEnd(8, '0')).clickContinue()
    enterPhonePage.hasFieldInError('phones[0].extension', 'Extension must be 7 characters or less')
  })

  it('goes to correct page on Back or Cancel', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    // Back to Edit Contact Methods
    Page.verifyOnPage(AddAddressPhonesPage, true) //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .clickAddAddressPhoneLink(contactAddressId)

    // Cancel to Contact Details page
    Page.verifyOnPage(AddAddressPhonesPage, true) //
      .clickLinkTo('Cancel', ManageContactDetailsPage, 'First Middle Names Last')
  })
})
