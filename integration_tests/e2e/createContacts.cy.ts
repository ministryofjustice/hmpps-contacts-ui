import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import SearchContactPage from '../pages/searchContactPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import CancelAddContactPage from '../pages/cancelAddContactPage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'

context('Create Contacts', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
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
    cy.task('stubGetContactNameById', { id: contactId, lastName: 'Last', firstName: 'First' })
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
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
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

  it('Can create a contact with only required fields', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .verifyShowCommentsAs('Not provided')
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
        isStaff: false,
        interpreterRequired: false,
        identities: [],
        addresses: [],
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
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

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Middle Last') //
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Middle Last') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Middle Last') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Middle Last') //
      .clickLink('Comments on their relationship with First Middle Last')

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Last', 'John Smith', true) //
      .enterComments('Some comments about this relationship')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Middle Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, Mr First Middle')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
      .verifyShowCommentsAs('Some comments about this relationship')
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
        titleCode: 'MR',
        lastName: 'Last',
        firstName: 'First',
        middleNames: 'Middle',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15',
        isStaff: false,
        interpreterRequired: false,
        identities: [],
        addresses: [],
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
          comments: 'Some comments about this relationship',
        },
      },
    )
  })

  it('Can create an official contact', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, First')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipAs('Doctor')
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
        isStaff: false,
        interpreterRequired: false,
        identities: [],
        addresses: [],
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'O',
          relationshipToPrisonerCode: 'DR',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
      },
    )
  })
  it('First name is required', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterLastName('Last').clickContinue()

    enterNamePage.hasFieldInError('firstName', 'Enter the contact’s first name')
  })

  it('Last name is required', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage.enterFirstName('First').clickContinue()

    enterNamePage.hasFieldInError('lastName', 'Enter the contact’s last name')
  })

  it('Names are limited to 35 characters', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('Last'.padEnd(36))
      .enterFirstName('First'.padEnd(36))
      .enterMiddleNames('Middle'.padEnd(36))
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', 'Contact’s last name must be 35 characters or less')
    enterNamePage.hasFieldInError('firstName', 'Contact’s first name must be 35 characters or less')
    enterNamePage.hasFieldInError('middleNames', 'Contact’s middle names must be 35 characters or less')
  })

  it('Cannot enter a blank first name or last name', () => {
    const enterNamePage = Page.verifyOnPage(EnterNamePage)
    enterNamePage //
      .enterLastName('  ')
      .enterFirstName('  ')
      .clickContinue()

    enterNamePage.hasFieldInError('lastName', 'Enter the contact’s last name')
    enterNamePage.hasFieldInError('firstName', 'Enter the contact’s first name')
  })

  it('Must select the contacts relationship to the prisoner', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    const selectRelationshipPage = Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith')
    selectRelationshipPage.clickContinue()

    selectRelationshipPage.hasFieldInError('relationship', 'Select the contact’s relationship to the prisoner')
  })

  it('Must select contact relationship', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
      .selectIsKnown('NO')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
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
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
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

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last')
    enterDobPage.clickContinue()

    enterDobPage.hasFieldInError('isKnown', 'Select whether the date of birth is known')
  })

  it('Must enter dob if it is known', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Last')
    enterDobPage.selectIsKnown('YES').clickContinue()
    enterDobPage.hasFieldInError('dob', 'Enter the contact’s date of birth')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Enter the contact’s date of birth')
    })
  })

  it('Day, month and year must be numbers', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
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
      .continueTo(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .continueTo(AddContactAdditionalInfoPage, 'First Last')
      .clickLink('Comments on their relationship with First Last')

    const commentsPage = Page.verifyOnPage(RelationshipCommentsPage, 'First Last', 'John Smith', true) //
      .enterComments(''.padEnd(241))
      .continueTo(RelationshipCommentsPage, 'First Last', 'John Smith', true)

    commentsPage.hasFieldInError('comments', 'Comments must be 240 characters or less')
  })

  it('Can navigate back through all pages', () => {
    const relationshipCommentsPage = Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(EnterContactDateOfBirthPage, 'First Last')
      .selectIsKnown('NO')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last')
      .selectIsNextOfKin('YES')
      .continueTo(AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo(
        'Comments on their relationship with First Last',
        RelationshipCommentsPage,
        'First Last',
        'John Smith',
        true,
      )
      .backTo(AddContactAdditionalInfoPage, 'First Last')
      .continueTo(CreateContactCheckYourAnswersPage)

    relationshipCommentsPage //
      .backTo(AddContactAdditionalInfoPage, 'First Last')
      .backTo(SelectNextOfKinPage, 'First Last')
      .backTo(SelectEmergencyContactPage, 'First Last')
      .backTo(SelectRelationshipPage, 'First Last', 'John Smith')
      .backTo(SelectRelationshipTypePage, 'First Last', 'John Smith')
      .backTo(EnterContactDateOfBirthPage, 'First Last')
      .backTo(EnterNamePage)
  })

  it('Cancelling from check answers prompts for confirmation', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(EnterContactDateOfBirthPage, 'First Last') //
      .selectIsKnown('NO')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Last') //
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Last') //
      .selectIsNextOfKin('YES')
      .continueTo(AddContactAdditionalInfoPage, 'First Last')
      .continueTo(CreateContactCheckYourAnswersPage) //
      .clickLink('Cancel')

    Page.verifyOnPage(CancelAddContactPage, 'NEW', 'First Last') //
      .clickButtonTo('No, return to check answers', CreateContactCheckYourAnswersPage)
      .clickLinkTo('Cancel', CancelAddContactPage, 'NEW', 'First Last') //
      .clickButton('Yes, cancel')

    Page.verifyOnPage(ListContactsPage)
  })
})
