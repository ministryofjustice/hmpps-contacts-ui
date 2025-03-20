import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'
import AddIdentityDocumentsPage from '../pages/addIdentityDocumentsPage'
import ConfirmDeleteIdentityPage from '../pages/contact-details/confirmDeleteIdentityPage'

context('Create Contact With Identity documents', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubIdentityTypeReferenceData')
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
        totalPages: 0,
        totalElements: 0,
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

  it('Can create a contact with some identity documents', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    // Can submit without entering an identity document and also go back to additional info
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Identity documents', AddIdentityDocumentsPage, 'First Last', true)
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Identity documents', AddIdentityDocumentsPage, 'First Last', true)
      .clickLink('Back')

    // Can enter some identity documents
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Identity documents', AddIdentityDocumentsPage, 'First Last', true)
      .selectType(0, 'DL')
      .enterIdentity(0, '0123456789')
      .enterIssuingAuthority(0, 'some authority')
      .clickAddAnotherButton()
      .selectType(1, 'NINO')
      .enterIdentity(1, '222222')
      .clickAddAnotherButton()
      .selectType(2, 'PASS')
      .enterIdentity(2, '987654321')
      .enterIssuingAuthority(2, 'Authority')
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Edit some identity documents and check we can go back
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Change the information about this Driving licence', AddIdentityDocumentsPage, 'First Last', true)
      .clickLinkTo('Back', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickLinkTo('Change the information about this Passport number', AddIdentityDocumentsPage, 'First Last', true)
      .enterIdentity(0, '0123456789x')
      .clearIssuingAuthority(0)
      .enterIdentity(2, '987654321x')
      .clickContinue()

    // Can delete identity document or cancel deleting them
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Delete the information about this Passport number', ConfirmDeleteIdentityPage, 'First Last')
      .clickButtonTo('No, do not delete', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickLinkTo(
        'Delete the information about this National insurance number',
        ConfirmDeleteIdentityPage,
        'First Last',
      )
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
        identities: [
          { identityType: 'DL', identityValue: '0123456789x' },
          {
            identityType: 'PASS',
            identityValue: '987654321x',
            issuingAuthority: 'Authority',
          },
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
