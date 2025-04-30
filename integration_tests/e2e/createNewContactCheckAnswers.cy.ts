import Page from '../pages/page'
import EnterNamePage from '../pages/enterNamePage'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SearchContactPage from '../pages/searchContactPage'
import CreateContactSuccessPage from '../pages/createContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import AddContactAdditionalInfoPage from '../pages/addContactAdditionalInfoPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import ManageDobPage from '../pages/contact-details/dobPage'

context('Create contact and update from check answers including authoriser fields', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_AUTHORISER'] })
    cy.task('stubComponentsMeta')
    cy.task('stubTitlesReferenceData')
    cy.task('stubPhoneTypeReferenceData')
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

    const { prisonerNumber } = TestData.prisoner()
    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickAddNewContactLink()
    Page.verifyOnPage(EnterNamePage) //
      .selectTitle('MR')
      .enterLastName('Last')
      .enterMiddleNames('Middle')
      .enterFirstName('First')
      .continueTo(ManageDobPage, 'First Middle Last', true)
      .enterDay('15')
      .enterMonth('06')
      .enterYear('1982')
      .continueTo(SelectRelationshipTypePage, 'First Middle Last', 'John Smith')
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'First Middle Last', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'First Middle Last', 'John Smith', true)
      .selectIsEmergencyContactOrNextOfKin('NONE')
      .continueTo(SelectApprovedVisitorPage, 'First Middle Last', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .continueTo(AddContactAdditionalInfoPage, 'First Middle Last')
      .clickLinkTo(
        'Comments on their relationship with John Smith',
        RelationshipCommentsPage,
        'First Middle Last',
        'John Smith',
        true,
      )
      .enterComments('Some comments about the relationship')
      .continueTo(AddContactAdditionalInfoPage, 'First Middle Last')
      .continueTo(CreateContactCheckYourAnswersPage, 'John Smith')
      .verifyShowsTitleAs('Mr')
      .verifyShowsNameAs('First Middle Last')
      .verifyShowsDateOfBirthAs('15 June 1982')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('No')
      .verifyShowCommentsAs('Some comments about the relationship')
  })

  it('Can change a contacts names when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowsTitleAs('Mr')
      .verifyShowsNameAs('First Middle Last')
      .clickLinkTo('Change the contact’s title', EnterNamePage)
      .selectTitle('DR')
      .clickButtonTo('Continue', CreateContactCheckYourAnswersPage, 'John Smith')
      .verifyShowsTitleAs('Dr')
      .clickLinkTo('Change the contact’s title', EnterNamePage)
      .enterLastName('Last Updated')
      .enterMiddleNames('Middle Updated')
      .enterFirstName('First Updated')
      .clickButtonTo('Continue', CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowsNameAs('First Updated Middle Updated Last Updated')
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

  it('Can change a contacts emergency contact or next of kin status when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('No')
      .clickChangeEmergencyContactLink()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'First Middle Last', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('ECNOK')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowIsEmergencyContactAs('Yes')
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
        dateOfBirth: '1982-06-15',
        isStaff: false,
        interpreterRequired: false,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: true,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change the comments when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'First Middle Last', 'John Smith', true) //
      .enterComments('Some new comments I entered')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
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

  it('Can change the visit approval status when creating a new contact as authoriser', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowApprovedVisitorAs('No')
      .clickLink('Change if the contact is approved to visit the prisoner')

    Page.verifyOnPage(SelectApprovedVisitorPage, 'First Middle Last', 'John Smith', true) //
      .selectIsApprovedVisitor('YES')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowApprovedVisitorAs('Yes')
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
        dateOfBirth: '1982-06-15',
        isStaff: false,
        interpreterRequired: false,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: true,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change the date of birth to unknown when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(ManageDobPage, 'First Middle Last', true) //
      .hasDay('15')
      .hasMonth('6')
      .hasYear('1982')
      .enterDay('')
      .enterMonth('')
      .enterYear('')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
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

  it('Can change the date of birth when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeDateOfBirthLink()

    Page.verifyOnPage(ManageDobPage, 'First Middle Last', true) //
      .hasDay('15')
      .hasMonth('6')
      .hasYear('1982')
      .enterDay('28')
      .enterMonth('12')
      .enterYear('2010')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
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
