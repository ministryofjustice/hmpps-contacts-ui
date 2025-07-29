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
import ConfirmDeleteEmailPage from '../pages/confirmDeleteEmailPage'
import AddEmailsPage from '../pages/addEmailsPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create Contact With Email addresses', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPhoneTypeReferenceData')
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
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickAddNewContactLink()
  })

  it('Can create a contact with some email addresses', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    // Can submit without entering an email address and also go back to additional info
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Email addresses', AddEmailsPage, 'First Last', true)
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Email addresses', AddEmailsPage, 'First Last', true)
      .clickLink('Back')

    // Can enter some email addresses
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Email addresses', AddEmailsPage, 'First Last', true)
      .enterEmail(0, 'a@mail.com')
      .clickAddAnotherButton()
      .enterEmail(1, 'b@mail.com')
      .clickAddAnotherButton()
      .enterEmail(2, 'c@mail.com')
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Edit some email addresses and check we can go back
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickChangeEmailLinkTo(0, AddEmailsPage, 'First Last', true)
      .clickLinkTo('Back', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickChangeEmailLinkTo(1, AddEmailsPage, 'First Last', true)
      .enterEmail(0, 'a2@mail.com')
      .enterEmail(2, 'c2@mail.com')
      .clickContinue()

    // Can delete email address or cancel deleting them
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickDeleteEmailLinkTo(0, ConfirmDeleteEmailPage, 'First Last')
      .hasEmailAddress('a2@mail.com')
      .clickButtonTo('No, do not delete', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickDeleteEmailLinkTo(1, ConfirmDeleteEmailPage, 'First Last')
      .hasEmailAddress('b@mail.com')
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
        emailAddresses: [{ emailAddress: 'a2@mail.com' }, { emailAddress: 'c2@mail.com' }],
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
