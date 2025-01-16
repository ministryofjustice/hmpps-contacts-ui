import Page from '../pages/page'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'
import AddContactSuccessPage from '../pages/addContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'

context('Add Existing Contact Check Answers', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Contact',
    firstName: 'Existing',
  })
  const searchResult = TestData.contactSearchResultItem({
    id: contact.id,
    lastName: contact.lastName,
    firstName: contact.firstName,
    middleNames: contact.middleNames,
  })
  const globalRestriction = TestData.getContactRestrictionDetails({ contactId: contact.id })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubAddContactRelationship', { contactId, createdPrisonerContactId: 654321 })
    cy.task('stubGetGlobalRestrictions', [globalRestriction])
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [searchResult],
      },
      lastName: 'FOO',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('FOO')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'Existing Contact') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'Existing Contact') //
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'Existing Contact') //
      .selectIsNextOfKin('YES')
      .continueTo(RelationshipCommentsPage, 'Existing Contact') //
      .enterComments('Some comments about the relationship')
      .continueTo(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Contact, Existing')
      .verifyShowsDateOfBirthAs('14 January 1990')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .verifyShowCommentsAs('Some comments about the relationship')
      .verifyNameIsNotChangeable()
      .verifyDateOfBirthIsNotChangeable()
  })

  it('Can change the relationship from check answers', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'Existing Contact') //
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'Existing Contact') //
      .selectRelationship('FA')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipAs('Father')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/prisoner-contact',
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'FA',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can change emergency contact from check answers', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'Existing Contact') //
      .verifyShowIsEmergencyContactAs('No')
      .clickChangeEmergencyContactLink()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Existing Contact') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsEmergencyContactAs('Yes')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/prisoner-contact',
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: true,
          comments: 'Some comments about the relationship',
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can change next of kin from check answers', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'Existing Contact') //
      .verifyShowIsNextOfKinAs('Yes')
      .clickChangeNextOfKinLink()

    Page.verifyOnPage(SelectNextOfKinPage, 'Existing Contact') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsNextOfKinAs('No')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/prisoner-contact',
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can change relationship comments from check answers', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'Existing Contact') //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'Existing Contact') //
      .enterComments('Some updated comments')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some updated comments')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/prisoner-contact',
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some updated comments',
        },
        createdBy: 'USER1',
      },
    )
  })
})
