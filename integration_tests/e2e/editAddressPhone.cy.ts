import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubAddressPhoneDetails } from '../mockApis/contactsApi'
import EditAddressPhonePage from '../pages/contact-methods/address/phone/editAddressPhonePage'
import EditContactMethodsPage from '../pages/editContactMethodsPage'

context('Edit Address Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contactAddressId = 555666
  const phoneWithExt = TestData.getAddressPhoneNumberDetails(
    'MOB',
    'Mobile',
    '07878 111111',
    99,
    contactAddressId,
    66,
    '123',
  )
  const phoneWithoutExt = TestData.getAddressPhoneNumberDetails(
    'HOME',
    'Home',
    '01111 777777',
    77,
    contactAddressId,
    11,
    '',
  )
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
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()
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
    cy.task('stubUpdateAddressPhone', { contactId, contactAddressId, contactAddressPhoneId: 99, updated })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithExt.contactAddressPhoneId)

    Page.verifyOnPage(EditAddressPhonePage) //
      .hasPhoneNumber('07878 111111')
      .enterPhoneNumber('999 888')
      .hasType('MOB')
      .selectType('HOME')
      .hasExtension('123')
      .clearExtension()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

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
    cy.task('stubUpdateAddressPhone', { contactId, contactAddressId, contactAddressPhoneId: 77, updated })

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithoutExt.contactAddressPhoneId)

    Page.verifyOnPage(EditAddressPhonePage) //
      .hasPhoneNumber('01111 777777')
      .enterPhoneNumber('987654321')
      .hasExtension('')
      .enterExtension('000')
      .hasType('HOME')
      .selectType('MOB')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

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

  it('Should require phone number', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithoutExt.contactAddressPhoneId)

    const enterPhonePage = Page.verifyOnPage(EditAddressPhonePage) //
      .clearPhoneNumber()
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithoutExt.contactAddressPhoneId)

    const enterPhonePage = Page.verifyOnPage(EditAddressPhonePage) //
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number must be 20 characters or less')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithoutExt.contactAddressPhoneId)

    const enterPhonePage = Page.verifyOnPage(EditAddressPhonePage) //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension must be 7 characters or less')
  })

  it('Back link goes to manage contact', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithoutExt.contactAddressPhoneId)

    Page.verifyOnPage(EditAddressPhonePage) //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
      .verifyOnContactsMethodsTab()
  })

  it('goes to correct page on Back or Cancel', () => {
    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickChangeAddressPhoneLink(phoneWithExt.contactAddressPhoneId)

    // Back to Edit Contact Methods
    Page.verifyOnPage(EditAddressPhonePage) //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .clickChangeAddressPhoneLink(phoneWithExt.contactAddressPhoneId)

    // Cancel to Contact Details page
    Page.verifyOnPage(EditAddressPhonePage) //
      .clickLinkTo('Cancel', ManageContactDetailsPage, 'First Middle Names Last')
  })
})
