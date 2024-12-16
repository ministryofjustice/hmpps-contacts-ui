import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubAddressPhoneDetails } from '../mockApis/contactsApi'
import ViewAllAddressesPage from '../pages/viewAllAddressesPage'
import EnterAddressPhonePage from '../pages/enterAddressPhonePage'

context('Edit Address Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contactAddressId = 555666
  const phoneWithExt = TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '07878 111111', 99, '123')
  const phoneWithoutExt = TestData.getContactPhoneNumberDetails('HOME', 'Home', '01111 777777', 77, '')
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [phoneWithExt, phoneWithoutExt],
    addresses: [
      TestData.address({
        contactAddressId,
        phoneNumbers: [phoneWithExt, phoneWithoutExt],
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

  it('Can edit a phone for an address with minimal fields', () => {
    const updated: StubAddressPhoneDetails = {
      contactPhoneId: 99,
      contactAddressPhoneId: 66,
      contactAddressId,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home',
      phoneNumber: '999 888',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
      updatedBy: 'USER1',
      updatedTime: new Date().toISOString(),
    }
    cy.task('stubUpdateAddressPhone', { contactId, contactAddressId, contactPhoneId: 99, updated })

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last').clickEditAddressPhoneLink(
      contactAddressId,
      phoneWithExt.contactPhoneId,
    )

    Page.verifyOnPage(EnterAddressPhonePage) //
      .hasPhoneNumber('07878 111111')
      .enterPhoneNumber('999 888')
      .hasType('MOB')
      .selectType('HOME')
      .hasExtension('123')
      .clearExtension()
      .clickContinue()

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone/99`,
      },
      {
        phoneType: 'HOME',
        phoneNumber: '999 888',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a phone for an address with all fields', () => {
    const updated: StubAddressPhoneDetails = {
      contactPhoneId: 77,
      contactAddressPhoneId: 66,
      contactAddressId,
      contactId,
      phoneType: 'MOB',
      phoneTypeDescription: 'Mobile',
      phoneNumber: '987654321',
      extNumber: '000',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
      updatedBy: 'USER1',
      updatedTime: new Date().toISOString(),
    }
    cy.task('stubUpdateAddressPhone', { contactId, contactAddressId, contactPhoneId: 77, updated })

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last').clickEditAddressPhoneLink(
      contactAddressId,
      phoneWithoutExt.contactPhoneId,
    )

    Page.verifyOnPage(EnterAddressPhonePage) //
      .hasPhoneNumber('01111 777777')
      .enterPhoneNumber('987654321')
      .hasExtension('')
      .enterExtension('000')
      .hasType('HOME')
      .selectType('MOB')
      .clickContinue()

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone/77`,
      },
      {
        phoneType: 'MOB',
        phoneNumber: '987654321',
        extNumber: '000',
        updatedBy: 'USER1',
      },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickEditAddressPhoneLink(contactAddressId, phoneWithoutExt.contactPhoneId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .selectType('')
      .enterPhoneNumber('01234 777777')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('type', 'Select the type of phone number')
  })

  it('Should require phone number', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickEditAddressPhoneLink(contactAddressId, phoneWithoutExt.contactPhoneId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .clearPhoneNumber()
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickEditAddressPhoneLink(contactAddressId, phoneWithoutExt.contactPhoneId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number should be 20 digits or fewer')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickEditAddressPhoneLink(contactAddressId, phoneWithoutExt.contactPhoneId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension should be 7 characters or fewer')
  })

  it('Back link goes to manage contact', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickEditAddressPhoneLink(contactAddressId, phoneWithoutExt.contactPhoneId)

    Page.verifyOnPage(EnterAddressPhonePage) //
      .backTo(ViewAllAddressesPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contact', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickEditAddressPhoneLink(contactAddressId, phoneWithoutExt.contactPhoneId)

    Page.verifyOnPage(EnterAddressPhonePage) //
      .cancelTo(ViewAllAddressesPage, 'First Middle Names Last')
  })
})
