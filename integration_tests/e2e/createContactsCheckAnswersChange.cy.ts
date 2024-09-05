import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreatedContactPage from '../pages/createdContactPage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'

context('Create contact and update from check answers', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
  })

  it('Can change a contacts names when creating a new contact', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('MR')
      .enterLastName('Last')
      .enterMiddleName('Middle')
      .enterFirstName('First')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsDobKnown(true)
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('15 June 1982')
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
      },
    )
  })
})
