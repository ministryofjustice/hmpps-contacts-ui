import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EnterPhonePage from '../pages/enterPhonePage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPhoneDetails } from '../mockApis/contactsApi'

context('Edit Contact Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [
      TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '07878 111111', 99, '123'),
      TestData.getContactPhoneNumberDetails('HOME', 'Home', '01111 777777', 77),
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can edit a contact phone with minimal fields', () => {
    const updated: StubPhoneDetails = {
      contactPhoneId: 99,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home',
      phoneNumber: '999 888',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
      updatedBy: 'USER1',
      updatedTime: new Date().toISOString(),
    }
    cy.task('stubUpdateContactPhone', { contactId, contactPhoneId: 99, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') // Phone with extension
      .clickEditPhoneNumberLink(99)

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .hasPhoneNumber('07878 111111')
      .enterPhoneNumber('999 888')
      .hasType('MOB')
      .selectType('HOME')
      .hasExtension('123')
      .clearExtension()
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/phone/99`,
      },
      {
        phoneType: 'HOME',
        phoneNumber: '999 888',
        updatedBy: 'USER1',
      },
    )
  })

  it('Can edit a contact phone with all fields', () => {
    const updated: StubPhoneDetails = {
      contactPhoneId: 77,
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
    cy.task('stubUpdateContactPhone', { contactId, contactPhoneId: 77, updated })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') // Phone without extension
      .clickEditPhoneNumberLink(77)

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .hasPhoneNumber('01111 777777')
      .enterPhoneNumber('987654321')
      .hasExtension('')
      .enterExtension('000')
      .hasType('HOME')
      .selectType('MOB')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')

    cy.verifyLastAPICall(
      {
        method: 'PUT',
        urlPath: `/contact/${contactId}/phone/77`,
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
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink(77)

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .selectType('')
      .enterPhoneNumber('01234 777777')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('type', 'Select the type of phone number')
  })

  it('Should require phone number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink(77)

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .clearPhoneNumber()
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink(77)

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number should be 20 digits or fewer')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink(77)

    const enterPhonePage = Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension should be 7 characters or fewer')
  })

  it('Back link goes to manage contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink(77)

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink(77)

    Page.verifyOnPage(EnterPhonePage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
