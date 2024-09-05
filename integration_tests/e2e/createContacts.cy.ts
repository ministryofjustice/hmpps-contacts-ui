import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreatedContactPage from '../pages/createdContactPage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'

context('Create Contacts', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
  })

  it('Can create a contact with only required fields', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsDobKnown(false)
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
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
      },
    )
  })

  it('Can create a contact with all fields', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('Mr')
      .enterLastName('Last')
      .enterFirstName('First')
      .enterMiddleName('Middle')
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
      },
    )
  })

  it('First name is required', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterLastName('Last').clickContinue()

    enterNamePage.hasFieldInError('firstName', "Enter the contact's first name")
  })

  it('Last name is required', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterFirstName('First').clickContinue()

    enterNamePage.hasFieldInError('lastName', "Enter the contact's last name")
  })

  it('Names are limited to 35 characters', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('Last'.padEnd(36))
      .enterFirstName('First'.padEnd(36))
      .enterMiddleName('Middle'.padEnd(36))
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', "Contact's last name must be 35 characters or less")
    enterNamePage.hasFieldInError('firstName', "Contact's first name must be 35 characters or less")
    enterNamePage.hasFieldInError('middleName', "Contact's middle name must be 35 characters or less")
  })

  it('Cannot enter a blank first name or last name', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('  ')
      .enterFirstName('  ')
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', "Enter the contact's last name")
    enterNamePage.hasFieldInError('firstName', "Enter the contact's first name")
  })

  it('Must select whether dob is known', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .clickContinue()

    enterDobPage.hasFieldInError('isDobKnown', 'Select whether the date of birth is known')
  })

  it('Must enter dob if it is known', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsDobKnown(true)
      .clickContinue()

    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(3)
      expect($lis[0]).to.contain('Enter a valid day of the month (1-31)')
      expect($lis[1]).to.contain('Enter a valid month (1-12)')
      expect($lis[2]).to.contain('Enter a valid year. Must be at least 1900')
    })
  })

  it('Day, month and year must be numbers', () => {
    cy.signIn()
    cy.visit('/contacts/create/start')
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const enterDobPage = new EnterContactDateOfBirthPage('Last, First')
    enterDobPage.checkOnPage()
    enterDobPage //
      .selectIsDobKnown(true)
      .enterDay('aa')
      .enterMonth('bb')
      .enterYear('cc')
      .clickContinue()

    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(3)
      expect($lis[0]).to.contain('Enter a valid day of the month (1-31)')
      expect($lis[1]).to.contain('Enter a valid month (1-12)')
      expect($lis[2]).to.contain('Enter a valid year. Must be at least 1900')
    })
  })
})
