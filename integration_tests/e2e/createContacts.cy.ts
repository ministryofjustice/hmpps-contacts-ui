import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreatedContactPage from '../pages/createdContactPage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import EnterContactEstimatedDateOfBirthPage from '../pages/enterContactEstimatedDateOfBirthPage'
import TestData from '../../server/routes/testutils/testData'
import SearchPrisonerPage from '../pages/searchPrisoner'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'

context('Create Contacts', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())

    cy.signIn()
  })

  it('Can create a contact with only required fields with direct link', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First') //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
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
          isNextOfKin: true,
          isEmergencyContact: false,
        },
      },
    )
  })

  it('Can create a contact with all fields', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('Mr')
      .enterLastName('Last')
      .enterFirstName('First')
      .enterMiddleName('Middle')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First Middle') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First Middle is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First Middle') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First Middle') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First Middle') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First') //
      .enterComments('Some comments about this relationship')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First Middle')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
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
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          comments: 'Some comments about this relationship',
        },
      },
    )
  })

  it('First name is required', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterLastName('Last').clickContinue()

    enterNamePage.hasFieldInError('firstName', "Enter the contact's first name")
  })

  it('Last name is required', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterFirstName('First').clickContinue()

    enterNamePage.hasFieldInError('lastName', "Enter the contact's last name")
  })

  it('Names are limited to 35 characters', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

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
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('  ')
      .enterFirstName('  ')
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', "Enter the contact's last name")
    enterNamePage.hasFieldInError('firstName', "Enter the contact's first name")
  })

  it('Must select the contacts relationship to the prisoner', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = Page.verifyOnPage(SelectRelationshipPage, 'Last, First')
    selectRelationshipPage.clickContinue()

    selectRelationshipPage.hasFieldInError('relationship', "Enter the contact's relationship to the prisoner")
  })

  it('Must select whether contact is an emergency contact', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    const selectEmergencyContactPage = Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First')
    selectEmergencyContactPage.clickContinue()

    selectEmergencyContactPage.hasFieldInError(
      'isEmergencyContact',
      'Select whether the contact is an emergency contact for the prisoner',
    )
  })

  it('Must select whether contact is an emergency contact', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    const selectNextOfKinPage = Page.verifyOnPage(SelectNextOfKinPage, 'Last, First')
    selectNextOfKinPage.clickContinue()

    selectNextOfKinPage.hasFieldInError('isNextOfKin', 'Select whether the contact is next of kin for the prisoner')
  })

  it('Must select whether dob is known', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First')
    enterDobPage.clickContinue()

    enterDobPage.hasFieldInError('isKnown', 'Select whether the date of birth is known')
  })

  it('Must enter dob if it is known', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First')
    enterDobPage.selectIsKnown('YES').clickContinue()

    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(3)
      expect($lis[0]).to.contain('Enter a valid day of the month (1-31)')
      expect($lis[1]).to.contain('Enter a valid month (1-12)')
      expect($lis[2]).to.contain('Enter a valid year. Must be at least 1900')
    })
  })

  it('Day, month and year must be numbers', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First')
    enterDobPage
      .selectIsKnown('YES') //
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

  it('Must select whether contact is over 18 if no dob is known', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('NO')
      .clickContinue()

    const estimatedDobPage = Page.verifyOnPage(EnterContactEstimatedDateOfBirthPage, 'Last, First')
    estimatedDobPage.clickContinue()

    estimatedDobPage.hasFieldInError('isOverEighteen', 'Select whether the contact is over 18')
  })

  it('Relationship comments must be less than 240 characters', () => {
    cy.visit('/prisoner/A1234BC/contacts/create/start')
    cy.task('stubCreateContact', { id: 132456 })

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipPage, 'Last, First') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('YES')
      .continueTo(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('NO')
      .continueTo(EnterContactEstimatedDateOfBirthPage, 'Last, First') //
      .selectIsOverEighteen('DO_NOT_KNOW')
      .clickContinue()

    const commentsPage = Page.verifyOnPage(RelationshipCommentsPage, 'Last, First') //
      .enterComments(''.padEnd(241))
      .continueTo(RelationshipCommentsPage, 'Last, First')

    commentsPage.hasFieldInError('comments', 'Additional information must be 240 characters or less')
  })

  it('Can create a contact from prisoner contact page', () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubCreateContact', { id: 132456 })

    cy.visit('/contacts/manage/prisoner-search/start')
    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
    searchPrisonerPage.prisonerSearchSearchButton().click()

    Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.clickPrisonerLink()

    Page.verifyOnPage(ListContactsPage) //
      .clickCreateNewContactButton()

    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Last, First') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Last, First is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Last, First') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Last, First') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'Last, First') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Last, First').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .clickCreatePrisonerContact()

    Page.verifyOnPage(ListContactsPage)
  })
})
