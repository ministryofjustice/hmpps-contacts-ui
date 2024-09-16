import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreatedContactPage from '../pages/createdContactPage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import EnterContactEstimatedDateOfBirthPage from '../pages/enterContactEstimatedDateOfBirthPage'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import TestData from '../../server/routes/testutils/testData'

context('Create contact and update from check answers', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.signIn()
    cy.visit('/prisoner/A1234BC/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })
  })

  it('Can change a contacts names when creating a new contact', () => {
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('MR')
      .enterLastName('Last')
      .enterMiddleName('Middle')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = new SelectRelationshipPage('Last, First')
    selectRelationshipPage.checkOnPage()
    selectRelationshipPage //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('DR')
      .enterLastName('Last Updated')
      .enterMiddleName('Middle Updated')
      .enterFirstName('First Updated')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last Updated, First Updated')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .clickCreatePrisonerContact()

    Page.verifyOnPage(CreatedContactPage)
    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        title: 'DR',
        lastName: 'Last Updated',
        firstName: 'First Updated',
        middleName: 'Middle Updated',
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

  it('Can change a contacts relationship when creating a new contact', () => {
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('MR')
      .enterLastName('Last')
      .enterMiddleName('Middle')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = new SelectRelationshipPage('Last, First')
    selectRelationshipPage.checkOnPage()
    selectRelationshipPage //
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipLink()

    const editRelationshipPage = new SelectRelationshipPage('Last, First')
    editRelationshipPage.checkOnPage()
    editRelationshipPage //
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .selectRelationship('FA')
      .hasSelectedRelationshipHint("Last, First is the prisoner's father")
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Father')
      .clickCreatePrisonerContact()

    Page.verifyOnPage(CreatedContactPage)
    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        title: 'MR',
        lastName: 'Last',
        firstName: 'First',
        middleName: 'Middle',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15T00:00:00.000Z',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'FA',
          isNextOfKin: false,
          isEmergencyContact: false,
        },
      },
    )
  })

  it('Can change a contacts dob from known to a different known dob', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = new SelectRelationshipPage('Last, First')
    selectRelationshipPage.checkOnPage()
    selectRelationshipPage //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .clickChangeDateOfBirthLink()

    const revisitedDobPage = new EnterContactDateOfBirthPage('Last, First')
    revisitedDobPage.checkOnPage()
    revisitedDobPage //
      .enterDay('16')
      .enterMonth('07')
      .enterYear('1983')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('16 July 1983')
      .verifyShowRelationshipAs('Mother')
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
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = new SelectRelationshipPage('Last, First')
    selectRelationshipPage.checkOnPage()
    selectRelationshipPage //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .clickChangeDateOfBirthLink()

    const revisitedDobPage = new EnterContactDateOfBirthPage('Last, First')
    revisitedDobPage.checkOnPage()
    revisitedDobPage //
      .selectIsKnown('NO')
      .clickContinue()

    const estimatedDobPage = new EnterContactEstimatedDateOfBirthPage('Last, First')
    estimatedDobPage.checkOnPage()
    estimatedDobPage //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipAs('Mother')
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
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = new SelectRelationshipPage('Last, First')
    selectRelationshipPage.checkOnPage()
    selectRelationshipPage //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsKnown('NO')
      .clickContinue()

    const estimatedDobPage = new EnterContactEstimatedDateOfBirthPage('Last, First')
    estimatedDobPage.checkOnPage()
    estimatedDobPage //
      .selectIsOverEighteen('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipAs('Mother')
      .clickChangeDateOfBirthLink()

    const revisitedDobPage = new EnterContactDateOfBirthPage('Last, First')
    revisitedDobPage.checkOnPage()
    revisitedDobPage //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
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
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = new SelectRelationshipPage('Last, First')
    selectRelationshipPage.checkOnPage()
    selectRelationshipPage //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsKnown('NO')
      .clickContinue()

    const estimatedDobPage = new EnterContactEstimatedDateOfBirthPage('Last, First')
    estimatedDobPage.checkOnPage()
    estimatedDobPage //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .clickChangeEstimatedDateOfBirthLink()

    estimatedDobPage.checkOnPage()
    estimatedDobPage //
      .selectIsOverEighteen('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
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
