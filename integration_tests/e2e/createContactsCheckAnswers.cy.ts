import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import EnterContactDateOfBirthPage from '../pages/enterContactDateOfBirthPage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import TestData from '../../server/routes/testutils/testData'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import ListContactsPage from '../pages/listContacts'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'

context('Create contact and update from check answers', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
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
    cy.task('stubGetContactNameById', { id: 123456, lastName: 'Last', firstName: 'First' })
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
      .selectTitle('MR')
      .enterLastName('Last')
      .enterMiddleNames('Middle')
      .enterFirstName('First')
      .continueTo(EnterContactDateOfBirthPage, 'First Middle Last')
      .selectIsKnown('YES')
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .continueTo(SelectRelationshipTypePage, 'First Middle Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Middle Last', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'First Middle Last')
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'First Middle Last')
      .selectIsNextOfKin('NO')
      .continueTo(AddContactAdditionalInfoPage, 'First Middle Last')
      .clickLinkTo(
        'Comments on their relationship with First Middle Last',
        RelationshipCommentsPage,
        'First Middle Last',
        'John Smith',
        true,
      )
      .enterComments('Some comments about the relationship')
      .continueTo(AddContactAdditionalInfoPage, 'First Middle Last')
      .continueTo(CreateContactCheckYourAnswersPage)
      .verifyShowsNameAs('Last, Mr First Middle')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('No')
      .verifyShowCommentsAs('Some comments about the relationship')
  })

  it('Can change a contacts names when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last, Mr First Middle')
      .clickChangeNameLink()

    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('DR')
      .enterLastName('Last Updated')
      .enterMiddleNames('Middle Updated')
      .enterFirstName('First Updated')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Last Updated, Dr First Updated Middle Updated')
      .continueTo(CreateContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/contact',
      },
      {
        titleCode: 'DR',
        lastName: 'Last Updated',
        firstName: 'First Updated',
        middleNames: 'Middle Updated',
        createdBy: 'USER1',
        dateOfBirth: '1982-06-15',
        isStaff: false,
        interpreterRequired: false,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts emergency contact status when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsEmergencyContactAs('No')
      .clickChangeEmergencyContactLink()

    Page.verifyOnPage(SelectEmergencyContactPage, 'First Middle Last') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsEmergencyContactAs('Yes')
      .continueTo(CreateContactSuccessPage)

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
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts next of kin status when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsNextOfKinAs('No')
      .clickChangeNextOfKinLink()

    Page.verifyOnPage(SelectNextOfKinPage, 'First Middle Last') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowIsNextOfKinAs('Yes')
      .continueTo(CreateContactSuccessPage)

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
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change the comments when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Last', 'John Smith', true) //
      .enterComments('Some new comments I entered')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some new comments I entered')
      .continueTo(CreateContactSuccessPage)

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
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some new comments I entered',
        },
      },
    )
  })

  it('Can change the date of birth to unknown when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Middle Last') //
      .hasIsKnown('YES')
      .hasDay('15')
      .hasMonth('6')
      .hasYear('1982')
      .selectIsKnown('NO')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('Not provided')
      .continueTo(CreateContactSuccessPage)

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
        isStaff: false,
        interpreterRequired: false,
        createdBy: 'USER1',
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change the date of birth to unknown when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(EnterContactDateOfBirthPage, 'First Middle Last') //
      .hasIsKnown('YES')
      .hasDay('15')
      .hasMonth('6')
      .hasYear('1982')
      .enterDay('28')
      .enterMonth('12')
      .enterYear('2010')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsDateOfBirthAs('28 December 2010')
      .continueTo(CreateContactSuccessPage)

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
        dateOfBirth: '2010-12-28',
        isStaff: false,
        interpreterRequired: false,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })
})
