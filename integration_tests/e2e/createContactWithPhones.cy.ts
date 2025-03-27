import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'
import AddPhonesPage from '../pages/contact-methods/addPhonesPage'
import ConfirmDeletePhonePage from '../pages/confirmDeletePhonePage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create Contact With Phone Numbers', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubCreateContact', {
      createdContact: { id: contactId },
      createdRelationship: { prisonerContactId },
    })
    cy.task(
      'stubGetContactById',
      TestData.contact({
        id: contactId,
        lastName: 'Last',
        firstName: 'First',
      }),
    )
    cy.task('stubGetContactNameById', { id: contactId, lastName: 'Last', firstName: 'First' })
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
      response: TestData.prisonerContactRelationship(),
    })
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 0,
          totalElements: 0,
        },
        content: [],
      },
      lastName: 'FOO',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
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
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('FOO')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .verifyShowsTheContactIsNotListedAs('The contact is not listed')
      .clickTheContactIsNotListed()
  })

  it('Can create a contact with some phone numbers', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .clickContinue()

    // Can submit without entering a phone number and also go back to additional info
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Phone numbers', AddPhonesPage, 'First Last', true)
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Phone numbers', AddPhonesPage, 'First Last', true)
      .clickLink('Back')

    // Can enter some phone numbers
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Phone numbers', AddPhonesPage, 'First Last', true)
      .selectType(0, 'MOB')
      .enterPhoneNumber(0, '11111')
      .enterExtension(0, '000')
      .clickAddAnotherButton()
      .selectType(1, 'BUS')
      .enterPhoneNumber(1, '222222')
      .clickAddAnotherButton()
      .selectType(2, 'HOME')
      .enterPhoneNumber(2, '33333')
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Edit some phone numbers and check we can go back
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Change the information about this Mobile phone number', AddPhonesPage, 'First Last', true)
      .clickLinkTo('Back', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickLinkTo('Change the information about this Home phone number', AddPhonesPage, 'First Last', true)
      .clearPhoneNumber(0)
      .enterPhoneNumber(0, '0123456789')
      .clearExtension(0)
      .clearPhoneNumber(2)
      .enterPhoneNumber(2, '987654321')
      .enterExtension(2, '#123')
      .clickContinue()

    // Can delete phone numbers or cancel deleting them
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Delete the information about this Mobile phone number', ConfirmDeletePhonePage, 'First Last')
      .clickButtonTo('No, do not delete', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickLinkTo('Delete the information about this Business phone number', ConfirmDeletePhonePage, 'First Last')
      .hasType('Business')
      .hasPhoneNumber('222222')
      .hasExtension('Not provided')
      .clickButtonTo('Yes, delete', CreateContactCheckYourAnswersPage, 'John Smith')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        isStaff: false,
        interpreterRequired: false,
        phoneNumbers: [
          { phoneType: 'MOB', phoneNumber: '0123456789' },
          { phoneType: 'HOME', phoneNumber: '987654321', extNumber: '#123' },
        ],
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
      },
    )
  })
})
