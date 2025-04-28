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
import SelectDomesticStatusPage from '../pages/contact-details/additional-information/selectDomesticStatusPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create Contact and Enter Domestic Status', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubGetDomesticStatuses')
    cy.task('stubOfficialRelationshipReferenceData')
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
  })

  it('Can create a contact with and select a domestic status', () => {
    // Domestic status is optional
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('Domestic status', SelectDomesticStatusPage, 'First Last', true)
      .clickLinkTo('Back', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('Domestic status', SelectDomesticStatusPage, 'First Last', true)
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Change to include a domestic status
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowDomesticStatusAs('Not provided')
      .clickLinkTo('Change the contact’s domestic status', SelectDomesticStatusPage, 'First Last', true)
      .selectDomesticStatus('S')
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith')
      .verifyShowDomesticStatusAs('Single-not married/in civil partnership')
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
        domesticStatusCode: 'S',
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
