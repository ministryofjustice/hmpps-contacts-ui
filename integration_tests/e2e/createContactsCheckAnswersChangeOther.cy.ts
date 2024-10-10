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

context('Create contact and update from check answers excluding DOB changes', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubCreateContact', { id: 132456 })
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
      .continueTo(SelectRelationshipPage, 'Last, First Middle')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'Last, First Middle')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'Last, First Middle')
      .selectIsNextOfKin('NO')
      .continueTo(EnterContactDateOfBirthPage, 'Last, First Middle')
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .continueTo(RelationshipCommentsPage)
      .enterComments('Some comments about the relationship')
      .continueTo(CreateContactCheckYourAnswersPage)
      .verifyShowsNameAs('Last, First Middle')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('No')
      .verifyShowCommentsAs('Some comments about the relationship')
  })

  it('Can change a contacts names when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First Middle')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('DR')
      .enterLastName('Last Updated')
      .enterMiddleNames('Middle Updated')
      .enterFirstName('First Updated')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last Updated, First Updated Middle Updated')
      .continueTo(ListContactsPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        title: 'DR',
        lastName: 'Last Updated',
        firstName: 'First Updated',
        middleNames: 'Middle Updated',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts relationship when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First Middle') //
      .hasSelectedRelationshipHint("Last, First Middle is the prisoner's mother.")
      .selectRelationship('FA')
      .hasSelectedRelationshipHint("Last, First Middle is the prisoner's father.")
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowRelationshipAs('Father')
      .continueTo(ListContactsPage)

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
          relationshipCode: 'FA',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts emergency contact status when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsEmergencyContactAs('No')
      .clickChangeEmergencyContactLink()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First Middle') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsEmergencyContactAs('Yes')
      .continueTo(ListContactsPage)

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
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts next of kin status when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsNextOfKinAs('No')
      .clickChangeNextOfKinLink()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First Middle') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsNextOfKinAs('Yes')
      .continueTo(ListContactsPage)

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
          relationshipCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change the comments when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First Middle') //
      .enterComments('Some new comments I entered')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some new comments I entered')
      .continueTo(ListContactsPage)

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
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          comments: 'Some new comments I entered',
        },
      },
    )
  })
})
