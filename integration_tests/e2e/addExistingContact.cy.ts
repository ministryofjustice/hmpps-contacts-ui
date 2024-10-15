import Page from '../pages/page'
import CreateContactCheckYourAnswersPage from '../pages/createContactCheckYourAnswersPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SelectEmergencyContactPage from '../pages/selectEmergencyContactPage'
import SelectNextOfKinPage from '../pages/selectNextOfKinPage'
import RelationshipCommentsPage from '../pages/relationshipCommentsPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'

context('Add Existing Contact', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const contact = TestData.contact({
    id: contactId,
    lastName: 'Contact',
    firstName: 'Existing',
  })
  const searchResult = TestData.contactSearchResultItem({
    id: contact.id,
    lastName: contact.lastName,
    firstName: contact.firstName,
    middleNames: contact.middleNames,
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubAddContactRelationship', contactId)
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [searchResult],
      },
      lastName: 'Contact',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })

    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()
  })

  it('Can add an existing contact with all fields and the contact has a date of birth', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
      isDeceased: false,
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Contact, Existing') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Contact, Existing') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Contact, Existing') //
      .enterComments('Some comments about the relationship')
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Contact, Existing')
      .verifyShowsDateOfBirthAs('14 January 1990')
      .verifyNoDeceasedDate()
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .verifyShowCommentsAs('Some comments about the relationship')
      .verifyNameIsNotChangeable()
      .verifyDateOfBirthIsNotChangeable()
      .verifyEstimatedDateOfBirthIsNotChangeable()
      .continueTo(ListContactsPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/relationship`,
      },
      {
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          comments: 'Some comments about the relationship',
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can add an existing contact with only optional fields and the contact has an estimated date of birth', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      estimatedIsOverEighteen: 'YES',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Contact, Existing') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Contact, Existing') //
      .selectIsNextOfKin('NO')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Contact, Existing') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Contact, Existing')
      .verifyShowsDateOfBirthAs('Not provided')
      .verifyShowsEstimatedDateOfBirthAs('Yes')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
      .verifyNameIsNotChangeable()
      .verifyDateOfBirthIsNotChangeable()
      .verifyEstimatedDateOfBirthIsNotChangeable()
      .continueTo(ListContactsPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/relationship`,
      },
      {
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Should require selection of emergency contact', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      estimatedIsOverEighteen: 'YES',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .clickContinue()

    const selectEmergencyContactPage = Page.verifyOnPage(SelectEmergencyContactPage, 'Contact, Existing')
    selectEmergencyContactPage.clickContinue()
    selectEmergencyContactPage.hasFieldInError(
      'isEmergencyContact',
      'Select whether the contact is an emergency contact for the prisoner',
    )
  })

  it('Should require selection of contact relationship', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      estimatedIsOverEighteen: 'YES',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    const selectRelationshipPage = Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing')
    selectRelationshipPage.clickContinue()

    selectRelationshipPage.hasFieldInError('relationship', "Enter the contact's relationship to the prisoner")
  })

  it('Should require selection of next of kin', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      estimatedIsOverEighteen: 'YES',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Contact, Existing') //
      .selectIsEmergencyContact('YES')
      .clickContinue()

    const selectNextOfKinPage = Page.verifyOnPage(SelectNextOfKinPage, 'Contact, Existing')
    selectNextOfKinPage.clickContinue()
    selectNextOfKinPage.hasFieldInError('isNextOfKin', 'Select whether the contact is next of kin for the prisoner')
  })

  it('Relationship hint is hidden for None, Social - Other and In Loco Parentes', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .selectRelationship('NONE')
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .selectRelationship('OTHER')
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .hasSelectedRelationshipHint("Contact, Existing is the prisoner's mother.")
      .selectRelationship('ILP')
      .hasNoRelationshipHint()
  })

  it('Can navigate all the way back to search from relationship comments', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
      .hasNoRelationshipHint()
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactPage, 'Contact, Existing') //
      .selectIsEmergencyContact('NO')
      .continueTo(SelectNextOfKinPage, 'Contact, Existing') //
      .selectIsNextOfKin('YES')
      .continueTo(RelationshipCommentsPage, 'Contact, Existing') //
      .backTo(SelectNextOfKinPage, 'Contact, Existing')
      .backTo(SelectEmergencyContactPage, 'Contact, Existing')
      .backTo(SelectRelationshipPage, 'Contact, Existing')
      .backTo(ContactConfirmationPage, 'Smith, John')
      .backTo(SearchContactPage)
      .verifyShowsNameAs('Contact, Existing')
  })

  it('Can add a deceased contact and show the deceased date on check answers page', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Deceased',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
      isDeceased: true,
      deceasedDate: '2020-12-25',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Deceased') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactPage, 'Contact, Deceased') //
      .selectIsEmergencyContact('NO')
      .clickContinue()

    Page.verifyOnPage(SelectNextOfKinPage, 'Contact, Deceased') //
      .selectIsNextOfKin('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Contact, Deceased') //
      .clickContinue()

    Page.verifyOnPage(CreateContactCheckYourAnswersPage) //
      .verifyShowsNameAs('Contact, Deceased')
      .verifyShowsDateOfBirthAs('14 January 1990')
      .verifyShowDeceasedDate('25 December 2020')
      .verifyNameIsNotChangeable()
      .verifyDateOfBirthIsNotChangeable()
      .verifyEstimatedDateOfBirthIsNotChangeable()
      .continueTo(ListContactsPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/contact/${contactId}/relationship`,
      },
      {
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
        },
        createdBy: 'USER1',
      },
    )
  })
})
