import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import EditContactMethodsPage from '../pages/editContactMethodsPage'
import AddPhonesPage from '../pages/contact-methods/addPhonesPage'

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

    Page.verifyOnPage(ManageContactDetailsPage, 'First Middle Names Last')
      .clickContactMethodsTab()
      .clickEditContactMethodsLink()

    Page.verifyOnPage(EditContactMethodsPage, 'First Middle Names Last') //
      .clickAddPhoneNumberLink()

    cy.task('stubCreateContactPhones', { contactId })
  })

  it('Can create multiple contact phone numbers', () => {
    Page.verifyOnPage(AddPhonesPage, 'First Middle Names Last') //
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
        urlPath: `/contact/${contactId}/phones`,
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
        createdBy: 'USER1',
      },
    )
  })

  it('Should keep details of other phone numbers if a different one has an error', () => {
    const addPhonesPage = Page.verifyOnPage(AddPhonesPage, 'First Middle Names Last') //
      .enterPhoneNumber(0, '01234 777777')
      .enterExtension(0, '000')
      .selectType(0, 'HOME')
      .clickAddAnotherButton()
      .enterPhoneNumber(1, 'a'.repeat(100))

    addPhonesPage.clickContinue()
    addPhonesPage.hasFieldInError('phones[1].type', 'Select the type of phone number')
    addPhonesPage.hasFieldInError('phones[1].phoneNumber', 'Phone number must be 20 characters or less')

    addPhonesPage //
      .hasType(0, 'HOME')
      .hasPhoneNumber(0, '01234 777777')
      .hasExtension(0, '000')
      .hasType(1, '')
      .hasPhoneNumber(1, 'a'.repeat(100))
      .hasExtension(1, '')
  })

  it('Should validate inputs', () => {
    // require phone number type
    const enterPhonePage = Page.verifyOnPage(AddPhonesPage, 'First Middle Names Last') //
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
    // Back to Edit Contact Methods
    Page.verifyOnPage(AddPhonesPage, 'First Middle Names Last') //
      .backTo(EditContactMethodsPage, 'First Middle Names Last')
      .clickAddPhoneNumberLink()

    // Cancel to Contact Details page
    Page.verifyOnPage(AddPhonesPage, 'First Middle Names Last') //
      .clickLinkTo('Cancel', ManageContactDetailsPage, 'First Middle Names Last')
  })
})
