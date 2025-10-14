import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import CancelAddContactPage from '../pages/cancelAddContactPage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create new contact as authoriser who can set visit approval', () => {
  const contactId = 654321
  const prisonerContactId = 987654

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_AUTHORISER'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 0,
          totalElements: 0,
        },
        content: [],
      },
    })
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
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickAddNewContactLink()
  })

  it('Can create a contact with only required fields', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('YES')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowsTitleAs('Not provided')
      .verifyShowsNameAs('First Last')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .verifyShowCommentsAs('Not provided')
      .clickContinue()

    Page.verifyOnPage(CreateContactSuccessPage) //
      .clickLink('add the restrictions now')

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
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: true,
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

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Middle Last', true) //
      .hasHintText('The contact’s date of birth is required for visits to the prisoner. For example, 27 3 1980.')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Middle Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('EC')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Middle Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Middle Last') //
      .clickLink('Comments on their relationship with John Smith')

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Last', 'John Smith', true) //
      .enterComments('Some comments about this relationship')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Middle Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowsTitleAs('Mr')
      .verifyShowsNameAs('First Middle Last')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
      .verifyShowCommentsAs('Some comments about this relationship')
      .clickContinue()

    Page.verifyOnPage(CreateContactSuccessPage)

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
        dateOfBirth: '1982-06-15',
        isStaff: false,
        interpreterRequired: false,
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

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(ManageDobPage, 'First Last', true) //
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .clickContinue()

    Page.verifyOnPage(AddContactAdditionalInfoPage, 'First Last') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowsTitleAs('Not provided')
      .verifyShowsNameAs('First Last')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowRelationshipAs('Doctor')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .clickContinue()

    Page.verifyOnPage(CreateContactSuccessPage) //
      .clickLink('add the restrictions now')

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
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    const selectRelationshipPage = Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith')
    selectRelationshipPage.clickContinue()

    selectRelationshipPage.hasFieldInError('relationship', 'Select the contact’s relationship to the prisoner')
  })

  it('Must enter dob if it is known', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(ManageDobPage, 'First Last', true)
    enterDobPage.enterYear(' ').clickContinue()
    enterDobPage.hasFieldInError('dob', 'Date of birth must include a day and a month')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(2)
      expect($lis[0]).to.contain('Date of birth must include a day and a month')
      expect($lis[1]).to.contain('Year must include 4 numbers')
    })
  })

  it('Day, month and year must be numbers', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    const enterDobPage = Page.verifyOnPage(ManageDobPage, 'First Last', true)
    enterDobPage.enterDay('aa').enterMonth('bb').enterYear('cccc').clickContinue()

    enterDobPage.hasFieldInError('dob', 'Date of birth must be a real date')
    enterDobPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be a real date')
    })
  })

  it('Relationship comments must be less than 240 characters', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(ManageDobPage, 'First Last', true) //
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .continueTo(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .continueTo(AddContactAdditionalInfoPage, 'First Last')
      .clickLink('Comments on their relationship with John Smith')

    const commentsPage = Page.verifyOnPage(RelationshipCommentsPage, 'First Last', 'John Smith', true) //
      .enterComments(''.padEnd(241))
      .continueTo(RelationshipCommentsPage, 'First Last', 'John Smith', true)

    commentsPage.hasFieldInError('comments', 'Comments must be 240 characters or less')
  })

  it('Can navigate back through all pages', () => {
    const relationshipCommentsPage = Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(ManageDobPage, 'First Last', true)
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .continueTo(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .continueTo(AddContactAdditionalInfoPage, 'First Last')
      .clickLinkTo(
        'Comments on their relationship with John Smith',
        RelationshipCommentsPage,
        'First Last',
        'John Smith',
        true,
      )
      .backTo(AddContactAdditionalInfoPage, 'First Last')
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith')

    relationshipCommentsPage //
      .backTo(AddContactAdditionalInfoPage, 'First Last')
      .backTo(SelectApprovedVisitorPage, 'First Last', 'John Smith', true)
      .backTo(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true)
      .backTo(ManageDobPage, 'First Last', true)
      .backTo(SelectRelationshipPage, 'First Last', 'John Smith')
      .backTo(SelectRelationshipTypePage, 'First Last', 'John Smith')
      .backTo(EnterNamePage)
  })

  it('Cancelling from check answers prompts for confirmation', () => {
    Page.verifyOnPage(EnterNamePage) //
      .enterLastName('Last')
      .enterFirstName('First')
      .continueTo(SelectRelationshipTypePage, 'First Last', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Last', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(ManageDobPage, 'First Last', true) //
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'First Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .continueTo(SelectApprovedVisitorPage, 'First Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .continueTo(AddContactAdditionalInfoPage, 'First Last')
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith') //
      .clickLink('Cancel')

    Page.verifyOnPage(CancelAddContactPage, 'NEW', 'First Last') //
      .clickButtonTo('No, return to check answers', CreateContactCheckYourAnswersPage, 'John Smith')
      .clickLinkTo('Cancel', CancelAddContactPage, 'NEW', 'First Last') //
      .clickButton('Yes, cancel')

    Page.verifyOnPage(ListContactsPage, 'John Smith')
  })
})
