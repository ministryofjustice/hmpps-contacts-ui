import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreatedContactPage from '../pages/createdContactPage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import EnterContactEstimatedDateOfBirthPage from '../pages/enterContactEstimatedDateOfBirthPage'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import TestData from '../../server/routes/testutils/testData'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'

context('Create contact and update from check answers where we are changing the DOB', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubCreateContact', { id: 132456 })

    cy.signIn()
    cy.visit('/prisoner/A1234BC/contacts/create/start')
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipPage, 'Last, First')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'Last, First')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'Last, First')
      .selectIsNextOfKin('NO')
      .continueTo(EnterContactDateOfBirthPage, 'Last, First')
  })

  it('Can change a contacts dob from known to a different known dob', () => {
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('15 June 1982')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .enterDay('16')
      .enterMonth('07')
      .enterYear('1983')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('16 July 1983')
      .clickCreatePrisonerContact()

    Page.verifyOnPage(CreatedContactPage)

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
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('15 June 1982')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First') //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .clickCreatePrisonerContact()

    Page.verifyOnPage(CreatedContactPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        isOverEighteen: 'DO_NOT_KNOW',
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
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First') //
      .selectIsOverEighteen('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs('Yes')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('15 June 1982')
      .clickCreatePrisonerContact()

    Page.verifyOnPage(CreatedContactPage)

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
    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First') //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .clickChangeEstimatedDateOfBirthLink()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First') //
      .selectIsOverEighteen('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs('Yes')
      .clickCreatePrisonerContact()

    Page.verifyOnPage(CreatedContactPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        isOverEighteen: 'YES',
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
