import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import TestData from '../../server/routes/testutils/testData'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'
import ListContactsPage from '../pages/listContacts'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'

context('Create contact and update the relationship from check answers', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubCreateContact', {
      createdContact: { id: 123456 },
      createdRelationship: { prisonerContactId: 654321 },
    })
    cy.task(
      'stubGetContactById',
      TestData.contact({
        id: 123456,
        lastName: 'Last',
        firstName: 'First',
      }),
    )
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: 654321,
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

    const { prisonerNumber } = TestData.prisoner()
    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('FOO')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .verifyShowsTheContactIsNotListedAs('The contact is not listed')
      .clickTheContactIsNotListed()
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('MR')
      .enterLastName('Last')
      .enterMiddleNames('Middle')
      .enterFirstName('First')
      .continueTo(EnterContactDateOfBirthPage, 'First Middle Last')
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .continueTo(SelectRelationshipTypePage, 'First Middle Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Middle Last', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Middle Last')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Middle Last')
      .selectIsNextOfKin('NO')
      .continueTo(RelationshipCommentsPage, 'First Middle Last')
      .enterComments('Some comments about the relationship')
      .continueTo(CreateContactCheckYourAnswersPage)
      .verifyShowsNameAs('Last, Mr First Middle')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('No')
      .verifyShowCommentsAs('Some comments about the relationship')
  })

  it('Can change a contacts relationship to prisoner directly when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('FA')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipAs('Father')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        title: 'MR',
        lastName: 'Last',
        firstName: 'First',
        middleNames: 'Middle',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'FA',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts relationship type to prisoner which requires updating relationship to prisoner when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipTypeAs('Official')
      .verifyShowRelationshipAs('Doctor')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        title: 'MR',
        lastName: 'Last',
        firstName: 'First',
        middleNames: 'Middle',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'O',
          relationshipToPrisoner: 'DR',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Re-selecting the same relationship type does not require re-entry of relationship to prisoner', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        title: 'MR',
        lastName: 'Last',
        firstName: 'First',
        middleNames: 'Middle',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })
})
