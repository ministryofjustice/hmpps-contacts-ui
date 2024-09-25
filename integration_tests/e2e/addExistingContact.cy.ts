import Page from '../pages/page'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'
import SearchContactPage from '../pages/searchContactPage'

context('Create Contacts', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const contact = TestData.contacts({ id: contactId, lastName: 'Contact', firstName: 'Existing', middleName: '' })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [contact],
      },
      lastName: 'FOO',
      firstName: '',
      middleName: '',
      dateOfBirth: '',
    })

    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('FOO')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .verifyShowsTheContactIsNotListedAs('The contact is not listed')
      .clickTheContactLink(contactId)
  })

  it('Can add an existing contact with only required fields', () => {
    // TODO Confirm contact page goes here

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasSelectedRelationshipHint('')
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Contact, Existing') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Contact, Existing') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Contact, Existing').clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Contact, Existing')
      // .verifyShowsDateOfBirthAs('Not provided')
      // .verifyShowsEstimatedDateOfBirthAs("I don't know")
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
    // TODO Confirm create relationship and check answers
    // verifyNameNotChangeable
    // verifyDOBNotChangeable
    // .clickAddPrisonerContact()

    // Page.verifyOnPage(ListContactsPage)
    // cy.verifyLastAPICall(
    //   {
    //     method: 'POST',
    //     urlPath: `/contact/${contactId}/relationship`,
    //   },
    //   {
    //     relationship: {
    //       prisonerNumber: 'A1234BC',
    //       relationshipCode: 'MOT',
    //       isNextOfKin: true,
    //       isEmergencyContact: false,
    //     },
    //     createdBy: 'USER1',
    //   },
    // )
  })
})
