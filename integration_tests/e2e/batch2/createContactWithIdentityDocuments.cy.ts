import Page from '../../pages/page'
import EnterNamePage from '../../pages/enterNamePage'
import CreateContactCheckYourAnswersPage from '../../pages/createContactCheckYourAnswersPage'
import TestData from '../../../server/routes/testutils/testData'
import ListContactsPage from '../../pages/listContacts'
import SelectRelationshipPage from '../../pages/selectRelationshipPage'
import SearchContactPage from '../../pages/searchContactPage'
import CreateContactSuccessPage from '../../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../../pages/selectRelationshipTypePage'
import AddContactAdditionalInfoPage from '../../pages/addContactAdditionalInfoPage'
import AddIdentityDocumentPage from '../../pages/addIdentityDocumentPage'
import ConfirmDeleteIdentityPage from '../../pages/contact-details/confirmDeleteIdentityPage'
import SelectEmergencyContactOrNextOfKinPage from '../../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../../pages/contact-details/dobPage'
import ChangeIdentityDocumentPage from '../../pages/changeIdentityDocumentPage'

context('Create Contact With Identity documents', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubIdentityTypeReferenceData')
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
    cy.task('stubGetContactHistory', { contactId, history: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickAddNewContactLink()
  })

  it('Can create a contact with some identity documents', () => {
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

    // Can submit without entering an identity document and also go back to additional info
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Identity documents', AddIdentityDocumentPage, 'First Last', true)
      .clickLinkTo('Cancel', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Identity documents', AddIdentityDocumentPage, 'First Last', true)
      .clickLink('Back')

    // Can enter some identity documents (first)
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Identity documents', AddIdentityDocumentPage, 'First Last', true)
      .selectType('DL')
      .enterIdentity('0123456789')
      .enterIssuingAuthority('some authority')
      .clickContinue()

    // Can enter some identity documents (second)
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Identity documents', AddIdentityDocumentPage, 'First Last', true)
      .selectType('NINO')
      .enterIdentity('222222')
      .clickContinue()

    // Can enter some identity documents (third)
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Identity documents', AddIdentityDocumentPage, 'First Last', true)
      .selectType('PASS')
      .enterIdentity('987654321')
      .enterIssuingAuthority('Authority')
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Edit some identity documents and check we can go back
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Change the information about this Driving licence', ChangeIdentityDocumentPage, 'First Last', true)
      .clickLinkTo('Back', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickLinkTo('Change the information about this Driving licence', ChangeIdentityDocumentPage, 'First Last', true)
      .clearIssuingAuthority()
      .enterIdentity('0123456789x')
      .clickContinue()
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLinkTo('Change the information about this Passport number', ChangeIdentityDocumentPage, 'First Last', true)
      .enterIdentity('987654321x')
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
