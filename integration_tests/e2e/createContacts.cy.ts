import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'
import SearchContactPage from '../pages/searchContactPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'

context('Create Contacts', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubCreateContact', {
      createdContact: { id: contactId },
      createdRelationship: { prisonerContactId },
    })
    cy.task(
      'stubGetContactById',
      TestData.contact({
        id: contactId,
        lastName: 'Last',
        firstName: 'First',
      }),
    )
    cy.task('stubGetPrisonerContactRelationshipById', {
      id: prisonerContactId,
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
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })

    cy.signIn()
    const { prisonerNumber } = TestData.prisoner()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('FOO')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .verifyShowsTheContactIsNotListedAs('The contact is not listed')
      .clickTheContactIsNotListed()
  })

  it('Can create a contact with only required fields with direct link', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Last').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .clickContinue()

    Page.verifyOnPage(CreateContactSuccessPage) //
      .clickContactInfoLink()

    Page.verifyOnPage(ManageContactDetailsPage, 'First Last')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        lastName: 'Last',
        firstName: 'First',
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipType: 'S',
          relationshipToPrisoner: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
        },
      },
    )
  })

  it('Can create a contact with all fields', () => {
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('Mr')
      .enterLastName('Last')
      .enterFirstName('First')
      .enterMiddleNames('Middle')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Middle Last') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Middle Last') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Middle Last') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Last') //
      .enterComments('Some comments about this relationship')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, Mr First Middle')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
      .clickContinue()

    Page.verifyOnPage(CreateContactSuccessPage) //
      .clickContactListLink()

    Page.verifyOnPage(ListContactsPage)

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
          isEmergencyContact: true,
          comments: 'Some comments about this relationship',
        },
      },
    )
  })

  it('First name is required', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterLastName('Last').clickContinue()

    enterNamePage.hasFieldInError('firstName', "Enter the contact's first name")
  })

  it('Last name is required', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterFirstName('First').clickContinue()

    enterNamePage.hasFieldInError('lastName', "Enter the contact's last name")
  })

  it('Names are limited to 35 characters', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('Last'.padEnd(36))
      .enterFirstName('First'.padEnd(36))
      .enterMiddleNames('Middle'.padEnd(36))
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', "Contact's last name must be 35 characters or less")
    enterNamePage.hasFieldInError('firstName', "Contact's first name must be 35 characters or less")
    enterNamePage.hasFieldInError('middleNames', "Contact's middle names must be 35 characters or less")
  })

  it('Cannot enter a blank first name or last name', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('  ')
      .enterFirstName('  ')
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', "Enter the contact's last name")
    enterNamePage.hasFieldInError('firstName', "Enter the contact's first name")
  })

  it('Must select the contacts relationship to the prisoner', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const selectRelationshipPage = Page.verifyOnPage(SelectRelationshipPage, 'First Last')
    selectRelationshipPage.clickContinue()

    selectRelationshipPage.hasFieldInError('relationship', "Enter the contact's relationship to the prisoner")
  })

  it('Must select contact relationship', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .clickContinue()

    const selectEmergencyContactPage = Page.verifyOnPage(SelectEmergencyContactPage, 'First Last')
    selectEmergencyContactPage.clickContinue()

    selectEmergencyContactPage.hasFieldInError(
      'isEmergencyContact',
      'Select whether the contact is an emergency contact for the prisoner',
    )
  })

  it('Must select whether contact is an emergency contact', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    const selectNextOfKinPage = Page.verifyOnPage(SelectNextOfKinPage, 'First Last')
    selectNextOfKinPage.clickContinue()

    selectNextOfKinPage.hasFieldInError('isNextOfKin', 'Select whether the contact is next of kin for the prisoner')
  })

  it('Must select whether dob is known', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last')
    enterDobPage.clickContinue()

    enterDobPage.hasFieldInError('isKnown', 'Select whether the date of birth is known')
  })

  it('Must enter dob if it is known', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last')
    enterDobPage.selectIsKnown('YES').clickContinue()
    enterDobPage.hasFieldInError('dob', "Enter the contact's date of birth")
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain("Enter the contact's date of birth")
    })
  })

  it('Day, month and year must be numbers', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last')
    enterDobPage
      .selectIsKnown('YES') //
      .enterDay('aa')
      .enterMonth('bb')
      .enterYear('cc')
      .clickContinue()

    enterDobPage.hasFieldInError('dob', 'Enter a valid day of the month (1-31)')
    enterDobPage.hasFieldInError('dob', 'Enter a valid month (1-12)')
    enterDobPage.hasFieldInError('dob', 'Enter a valid year. Must be at least 1900')
    enterDobPage.hasFieldInError('dob', 'The date of birth is invalid')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(4)
      expect($lis[0]).to.contain('Enter a valid day of the month (1-31)')
      expect($lis[1]).to.contain('Enter a valid month (1-12)')
      expect($lis[2]).to.contain('Enter a valid year. Must be at least 1900')
      expect($lis[3]).to.contain('The date of birth is invalid')
    })
  })

  it('Relationship comments must be less than 240 characters', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipPage, 'First Last') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .continueTo(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    const commentsPage = Page.verifyOnPage(RelationshipCommentsPage, 'First Last') //
      .enterComments(''.padEnd(241))
      .continueTo(RelationshipCommentsPage, 'First Last')

    commentsPage.hasFieldInError('comments', 'Additional information must be 240 characters or less')
  })

  it('Can navigate back through all pages when no DOB', () => {
    const relationshipCommentsPage = Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipPage, 'First Last')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last')
      .selectIsNextOfKin('YES')
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
      .selectIsKnown('NO')
      .continueTo(RelationshipCommentsPage, 'First Last')

    relationshipCommentsPage //
      .backTo(EnterContactDateOfBirthPage, 'First Last')
      .backTo(SelectNextOfKinPage, 'First Last')
      .backTo(SelectEmergencyContactPage, 'First Last')
      .backTo(SelectRelationshipPage, 'First Last')
      .backTo(EnterNamePage)
  })

  it('Can navigate back through all pages when DOB is known', () => {
    const relationshipCommentsPage = Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipPage, 'First Last')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last')
      .selectIsNextOfKin('YES')
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .continueTo(RelationshipCommentsPage, 'First Last')

    relationshipCommentsPage //
      .backTo(EnterContactDateOfBirthPage, 'First Last')
      .backTo(SelectNextOfKinPage, 'First Last')
      .backTo(SelectEmergencyContactPage, 'First Last')
      .backTo(SelectRelationshipPage, 'First Last')
      .backTo(EnterNamePage)
      .backTo(SearchContactPage)
  })
})
