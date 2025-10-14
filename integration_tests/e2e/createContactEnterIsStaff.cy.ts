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
import SelectStaffStatusPage from '../pages/contact-details/selectStaffStatus'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create Contact and Select Staff Status', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubRelationshipReferenceData')
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
  })

  it('Can create a contact with and select staff status', () => {
    // Gender is optional
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickLinkTo('If the contact is a member of staff', SelectStaffStatusPage, 'First Last', true)
      .clickLinkTo('Back', AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo('If the contact is a member of staff', SelectStaffStatusPage, 'First Last', true)
      .clickButtonTo('Continue', AddContactAdditionalInfoPage, 'First Last')
      .clickContinue()

    // Change to include a gender
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowIsStaffAs('Not provided')
      .clickLinkTo('Change if the contact is a member of staff', SelectStaffStatusPage, 'First Last', true)
      .selectStaffStatus('NO')
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith')
      .verifyShowIsStaffAs('No')
      .clickLinkTo('Change if the contact is a member of staff', SelectStaffStatusPage, 'First Last', true)
      .selectStaffStatus('YES')
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith')
      .verifyShowIsStaffAs('Yes')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        isStaff: true,
        interpreterRequired: false,
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

  it('Can create a contact with staff status defaults to no if not answered', () => {
    // Staff status is optional
    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickContinue()

    // Change to include staff status
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowIsStaffAs('Not provided')
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
