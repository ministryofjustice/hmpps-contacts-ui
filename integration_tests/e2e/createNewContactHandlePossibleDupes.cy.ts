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
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'
import PossibleExistingRecordsPage from '../pages/possibleExistingRecordsPage'
import PossibleExistingRecordMatchPage from '../pages/possibleExistingRecordMatchPage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import LinkExistingContactCYAPage from '../pages/linkExistingContactCYAPage'
import AddContactSuccessPage from '../pages/addContactSuccessPage'

context('Create a new contact and handle possible duplicates', () => {
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

  it('Can ignore possible existing records and continue with adding the contact', () => {
    const existingContact = TestData.contact({
      id: 555666777,
      firstName: 'First',
      middleNames: 'Possible Record',
      lastName: 'Last',
    })
    cy.task('stubCreateContact', {
      createdContact: { id: contactId },
      createdRelationship: { prisonerContactId },
    })
    cy.task('stubGetContactById', existingContact)
    cy.task('stubGetContactNameById', existingContact)
    cy.task('stubGetLinkedPrisoners', { contactId: existingContact.id, linkedPrisoners: [] })
    cy.task('stubGetGlobalRestrictions', [TestData.getContactRestrictionDetails({ contactId: existingContact.id })])
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [
          TestData.contactSearchResultItem({
            id: existingContact.id,
            firstName: 'First',
            middleNames: 'Possible Record',
            lastName: 'Last',
          }),
          TestData.contactSearchResultItem({
            id: 564987456123,
            firstName: 'First',
            middleNames: 'Another Record',
            lastName: 'Last',
          }),
        ],
      },
    })

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .enterDay('15')
      .enterMonth('6')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(PossibleExistingRecordsPage, true)
      .clickLinkTo('Continue adding a new contact', SelectRelationshipTypePage, 'First Last', 'John Smith')
      .backTo(PossibleExistingRecordsPage, true)
      .clickIndexedLinkTo(
        0,
        'Check if this is the correct contact',
        PossibleExistingRecordMatchPage,
        'First Possible Record Last',
        'John Smith',
      )
      .selectRadio('NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS')
      .continueTo(PossibleExistingRecordsPage, true)
      .clickIndexedLinkTo(
        0,
        'Check if this is the correct contact',
        PossibleExistingRecordMatchPage,
        'First Possible Record Last',
        'John Smith',
      )
      .selectRadio('NO_CONTINUE_ADDING_CONTACT')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .continueTo(AddContactAdditionalInfoPage, 'First Last') //
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith') //
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        dateOfBirth: '1982-06-15',
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

  it('Can choose a possible existing record and add a new relationship instead of a new contact', () => {
    const existingContact = TestData.contact({
      id: 555666777,
      firstName: 'First',
      middleNames: 'Possible Record',
      lastName: 'Last',
    })
    cy.task('stubAddContactRelationship', {
      contactId: existingContact.id,
      createdPrisonerContactId: prisonerContactId,
    })
    cy.task('stubGetContactById', existingContact)
    cy.task('stubGetContactNameById', existingContact)
    cy.task('stubGetLinkedPrisoners', { contactId: existingContact.id, linkedPrisoners: [] })
    cy.task('stubGetGlobalRestrictions', [TestData.getContactRestrictionDetails({ contactId: existingContact.id })])
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [
          TestData.contactSearchResultItem({
            id: existingContact.id,
            firstName: 'First',
            middleNames: 'Possible Record',
            lastName: 'Last',
          }),
        ],
      },
    })

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .enterDay('15')
      .enterMonth('6')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(PossibleExistingRecordsPage, false)
      .clickIndexedLinkTo(
        0,
        'Check if this is the correct contact',
        PossibleExistingRecordMatchPage,
        'First Possible Record Last',
        'John Smith',
      )
      .selectRadio('YES')
      .continueTo(SelectRelationshipTypePage, 'First Possible Record Last', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Possible Record Last', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'First Possible Record Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .continueTo(RelationshipCommentsPage, 'First Possible Record Last', 'John Smith', true) //
      .enterComments('Some comments about the relationship')
      .continueTo(LinkExistingContactCYAPage) //
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId: existingContact.id,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })
})
