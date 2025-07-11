import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EditPhonePage from '../pages/editPhonePage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import { ContactPhoneDetails } from '../../server/@types/contactsApiClient'

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
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can edit a contact phone with minimal fields', () => {
    const updated: ContactPhoneDetails = {
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
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('07878 111111, ext. 123')

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
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
        urlPath: `/contact/${contactId}/phone/99`,
      },
      {
        phoneType: 'HOME',
        phoneNumber: '999 888',
      },
    )
  })

  it('Can edit a contact phone with all fields', () => {
    const updated: ContactPhoneDetails = {
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
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('01111 777777')

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
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
        urlPath: `/contact/${contactId}/phone/77`,
      },
      {
        phoneType: 'MOB',
        phoneNumber: '987654321',
        extNumber: '000',
      },
    )
  })

  it('Should require phone number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('01111 777777')

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .clearPhoneNumber()
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('01111 777777')

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number must be 20 characters or less')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('01111 777777')

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension must be 7 characters or less')
  })

  it('Back link goes to manage contact via edit contact details', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('01111 777777')

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Cancel goes to manage contact', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickEditPhoneNumberLink('01111 777777')

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
  })
})
