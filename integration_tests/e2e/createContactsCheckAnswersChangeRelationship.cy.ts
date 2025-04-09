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

context('Create contact and update the relationship from check answers', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
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

  it('Can change a contacts relationship to prisoner directly when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipLink()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('FA')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipAs('Father')
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
          relationshipToPrisonerCode: 'FA',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can change a contacts relationship type to prisoner which requires updating relationship to prisoner when creating a new contact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipTypeAs('Official')
      .verifyShowRelationshipAs('Doctor')
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
          relationshipTypeCode: 'O',
          relationshipToPrisonerCode: 'DR',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Re-selecting the same relationship type does not require re-entry of relationship to prisoner', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
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
          comments: 'Some comments about the relationship',
        },
      },
    )
  })

  it('Can abandon changing the relationship by going back which leaves the relationship intact', () => {
    Page.verifyOnPage(CreateContactCheckYourAnswersPage, 'John Smith') //
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
      .clickChangeRelationshipTypeLink()

    Page.verifyOnPage(SelectRelationshipTypePage, 'First Middle Last', 'John Smith') //
      .selectRelationshipType('O')
      .clickButtonTo('Continue', SelectRelationshipPage, 'First Middle Last', 'John Smith') //
      .selectRelationship('DR')
      .clickLinkTo('Back', SelectRelationshipTypePage, 'First Middle Last', 'John Smith')
      .clickLinkTo('Back', CreateContactCheckYourAnswersPage, 'John Smith')
      .verifyShowRelationshipTypeAs('Social')
      .verifyShowRelationshipAs('Mother')
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
          comments: 'Some comments about the relationship',
        },
      },
    )
  })
})
