import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import EnterContactEstimatedDateOfBirthPage from '../pages/enterContactEstimatedDateOfBirthPage'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import TestData from '../../server/routes/testutils/testData'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'
import ListContactsPage from '../pages/listContacts'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'

context('Create contact and update from check answers where we are changing the DOB', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
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
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipPage, 'First Last')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last')
      .selectIsNextOfKin('NO')
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
  })

  it('Can change a contacts dob from known to a different known dob', () => {
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Last').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('15 June 1982')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .enterDay('16')
      .enterMonth('07')
      .enterYear('1983')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('16 July 1983')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        createdBy: 'USER1',
        dateOfBirth: '1983-07-16T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
        },
      },
    )
  })

  it('Can change a contacts dob from known to unknown', () => {
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Last').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('15 June 1982')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'First Last') //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        estimatedIsOverEighteen: 'DO_NOT_KNOW',
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
        },
      },
    )
  })

  it('Can change a contacts dob from unknown to known', () => {
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'First Last') //
      .selectIsOverEighteen('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Last').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs('Yes')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('15 June 1982')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
        },
      },
    )
  })

  it('Can change a contacts estimated dob', () => {
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'First Last') //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Last').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .clickChangeEstimatedDateOfBirthLink()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'First Last') //
      .selectIsOverEighteen('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs('Yes')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        estimatedIsOverEighteen: 'YES',
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
        },
      },
    )
  })
})
