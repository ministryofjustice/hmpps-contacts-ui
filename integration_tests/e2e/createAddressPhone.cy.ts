import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubAddressPhoneDetails } from '../mockApis/contactsApi'
import ViewAllAddressesPage from '../pages/viewAllAddressesPage'
import EnterAddressPhonePage from '../pages/enterAddressPhonePage'

context('Create Address Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contactAddressId = 555666
  const phoneOne = TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '07878 111111', 1)
  const phoneTwo = TestData.getContactPhoneNumberDetails('HOME', 'Home', '01111 777777', 2)
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

  it('Can create a phone for an address with minimal fields', () => {
    const created: StubAddressPhoneDetails = {
      contactAddressPhoneId: 99,
      contactPhoneId: 66,
      contactAddressId,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home',
      phoneNumber: '01234 777777',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateAddressPhone', { contactId, contactAddressId, created })

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    Page.verifyOnPage(EnterAddressPhonePage) //
      .enterPhoneNumber('01234 777777')
      .selectType('HOME')
      .clickContinue()

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone`,
      },
      {
        contactAddressId,
        phoneType: 'HOME',
        phoneNumber: '01234 777777',
        createdBy: 'USER1',
      },
    )
  })

  it('Can create a phone for an address with all fields', () => {
    const created: StubAddressPhoneDetails = {
      contactAddressPhoneId: 99,
      contactPhoneId: 66,
      contactAddressId,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home',
      phoneNumber: '01234 777777',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateAddressPhone', { contactId, contactAddressId, created })

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    Page.verifyOnPage(EnterAddressPhonePage) //
      .enterPhoneNumber('01234 777777')
      .enterExtension('000')
      .selectType('HOME')
      .clickContinue()

    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/address/${contactAddressId}/phone`,
      },
      {
        contactAddressId,
        phoneType: 'HOME',
        phoneNumber: '01234 777777',
        extNumber: '000',
        createdBy: 'USER1',
      },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .enterPhoneNumber('01234 777777')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('type', 'Select the type of phone number')
  })

  it('Should require phone number', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .selectType('HOME')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .selectType('HOME')
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number should be 20 digits or fewer')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    const enterPhonePage = Page.verifyOnPage(EnterAddressPhonePage) //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension should be 7 characters or fewer')
  })

  it('Back link goes to view all addresses', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    Page.verifyOnPage(EnterAddressPhonePage) //
      .backTo(ViewAllAddressesPage, 'First Middle Names Last')
  })

  it('Cancel goes to view all addresses', () => {
    Page.verifyOnPage(ViewAllAddressesPage, 'First Middle Names Last') //
      .clickAddAddressPhoneLink(contactAddressId)

    Page.verifyOnPage(EnterAddressPhonePage) //
      .cancelTo(ViewAllAddressesPage, 'First Middle Names Last')
  })
})
