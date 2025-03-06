import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import EditPhonePage from '../pages/editPhonePage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import { StubPhoneDetails } from '../mockApis/contactsApi'
import EditContactMethodsPage from '../pages/editContactMethodsPage'

context('Create Contact Phones', () => {
  const contactId = 654321
  const prisonerContactId = 987654
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Last',
    firstName: 'First',
    middleNames: 'Middle Names',
    phoneNumbers: [
      TestData.getContactPhoneNumberDetails('MOB', 'Mobile', '07878 111111'),
      TestData.getContactPhoneNumberDetails('HOME', 'Home', '01111 777777'),
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
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/relationship/${prisonerContactId}`)

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
  })

  it('Can create a contact phone with minimal fields', () => {
    const created: StubPhoneDetails = {
      contactPhoneId: 99,
      contactId,
      phoneType: 'HOME',
      phoneTypeDescription: 'Home',
      phoneNumber: '01234 777777',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactPhone', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber('01234 777777')
      .selectType('HOME')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

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
      phoneTypeDescription: 'Home',
      phoneNumber: '01234 777777',
      extNumber: '000',
      createdBy: 'USER1',
      createdTime: new Date().toISOString(),
    }
    cy.task('stubCreateContactPhone', { contactId, created })

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber('01234 777777')
      .enterExtension('000')
      .selectType('HOME')
      .clickContinue()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last').hasSuccessBanner(
      'You’ve updated the contact methods for First Middle Names Last.',
    )

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
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .enterPhoneNumber('01234 777777')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('type', 'Select the type of phone number')
  })

  it('Should require phone number', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Enter a phone number')
  })

  it('Should require phone number is 20 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
      .enterPhoneNumber(''.padEnd(21, '0'))
    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('phoneNumber', 'Phone number must be 20 characters or less')
  })

  it('Should require extension is 7 chars or fewer', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    const enterPhonePage = Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .selectType('HOME')
      .enterPhoneNumber('0123')
      .enterExtension(''.padEnd(8, '0'))

    enterPhonePage.clickContinue()
    enterPhonePage.hasFieldInError('extension', 'Extension must be 7 characters or less')
  })

  it('Back link goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .backTo(ManageContactDetailsPage, 'First Middle Names Last')
      .verifyOnContactsMethodsTab()
  })

  it('Cancel goes to manage contacts', () => {
    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last') //
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    Page.verifyOnPage(EditPhonePage, 'First Middle Names Last') //
      .cancelTo(EditContactMethodsPage, 'First Middle Names Last')
      .cancelTo(ManageContactDetailsPage, 'First Middle Names Last')
      .verifyOnContactsMethodsTab()
  })
})
