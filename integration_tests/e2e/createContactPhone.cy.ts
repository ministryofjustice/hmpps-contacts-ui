import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EnterPhonePage from '../pages/enterPhonePage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPhoneDetails } from '../mockApis/contactsApi'

context('Create Contact Phones', () => {
  const contactId = 654321
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [
      TestData.getContactPhoneNumberDetails('MOB', 'Mobile phone', '07878 111111'),
      TestData.getContactPhoneNumberDetails('HOME', 'Home phone', '01111 777777'),
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
    cy.task('stubGetGenders')

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can create a contact phone with minimal fields', () => {
    const created: StubPhoneDetails = {
      contactPhoneId: 99,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home phone',
      phoneNumber: '01234 777777',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactPhone', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber('01234 777777')
      .selectType('HOME')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/phone`,
      },
      {
        phoneType: 'HOME',
        phoneNumber: '01234 777777',
        createdBy: 'USER1',
      },
    )
  })

  it('Can create a contact phone with all fields', () => {
    const created: StubPhoneDetails = {
      contactPhoneId: 99,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home phone',
      phoneNumber: '01234 777777',
      extNumber: '000',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactPhone', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber('01234 777777')
      .enterExtension('000')
      .selectType('HOME')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/phone`,
      },
      {
        phoneType: 'HOME',
        phoneNumber: '01234 777777',
        extNumber: '000',
        createdBy: 'USER1',
      },
    )
  })

  it('Should require type', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber('01234 777777')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('type', 'Select the type of phone number')
  })

  it('Should require phone number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number should be 20 digits or fewer')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension should be 7 characters or fewer')
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').clickAddPhoneNumberLink()

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
