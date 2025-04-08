import Page from '../pages/page'
import LinkExistingContactCYAPage from '../pages/linkExistingContactCYAPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'
import AddContactSuccessPage from '../pages/addContactSuccessPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'
import CancelAddContactPage from '../pages/cancelAddContactPage'

context('Add Existing Contact', () => {
  const { prisonerNumber } = TestData.prisoner()
  const contactId = 654321
  const prisonerContactId = 987654
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

  const globalRestriction = TestData.getContactRestrictionDetails({ contactId: contact.id })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetGlobalRestrictions', [globalRestriction])
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
    cy.task('stubAddContactRelationship', { contactId, createdPrisonerContactId: prisonerContactId })
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [searchResult],
      },
      lastName: 'Contact',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/list` })

    Page.verifyOnPage(ListContactsPage, 'John Smith') //
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
      employments: [],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Existing Contact', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true, 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true) //
      .selectIsApprovedVisitor('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .enterComments('Some comments about the relationship')
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .verifyShowsNameAs('Existing Contact (654321)')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickContinue()

    Page.verifyOnPage(AddContactSuccessPage) //
      .clickLink('add the restrictions now')

    Page.verifyOnPage(ManageContactDetailsPage, 'Existing Contact')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: true,
          comments: 'Some comments about the relationship',
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can add an existing contact with only optional fields', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      employments: [],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Existing Contact', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true, 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .verifyShowsNameAs('Existing Contact (654321)')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('Not provided')
      .verifyShowIsNextOfKinAs('Not provided')
      .clickContinue()

    Page.verifyOnPage(AddContactSuccessPage) //
      .clickLink('View Existing Contact’s contact information')

    Page.verifyOnPage(ManageContactDetailsPage, 'Existing Contact')

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: false,
          isApprovedVisitor: false,
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can add an official contact', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('O')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Existing Contact', 'John Smith') //
      .selectRelationship('DR')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('EC')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true) //
      .selectIsApprovedVisitor('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .verifyShowsNameAs('Existing Contact (654321)')
      .verifyShowRelationshipAs('Doctor')
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
      .clickContinue()

    Page.verifyOnPage(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'O',
          relationshipToPrisonerCode: 'DR',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: true,
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Should require selection of contact relationship', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    const selectRelationshipPage = Page.verifyOnPage(SelectRelationshipPage, 'Existing Contact', 'John Smith')
    selectRelationshipPage.clickContinue()

    selectRelationshipPage.hasFieldInError('relationship', 'Select the contact’s relationship to the prisoner')
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

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'Existing Contact', 'John Smith')
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true)
      .selectIsEmergencyContactOrNextOfKin('NONE')
      .continueTo(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true)
      .selectIsApprovedVisitor('YES')
      .continueTo(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true)
      .continueTo(LinkExistingContactCYAPage)
      .backTo(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true)
      .backTo(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true)
      .backTo(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true)
      .backTo(SelectRelationshipPage, 'Existing Contact', 'John Smith')
      .backTo(SelectRelationshipTypePage, 'Existing Contact', 'John Smith')
      .backTo(ContactConfirmationPage, 'Existing Contact', 'John Smith')
      .backTo(SearchContactPage)
      .verifyShowsNameAs('Contact, Existing')
  })

  it('Can add a deceased contact and show the deceased date on check answers page', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Deceased',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
      deceasedDate: '2020-12-25',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Deceased Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Deceased Contact', 'John Smith') //
      .selectRelationshipType('S')
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Deceased Contact', 'John Smith') //
      .selectRelationship('MOT')
      .clickContinue()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'Deceased Contact', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .clickContinue()

    Page.verifyOnPage(SelectApprovedVisitorPage, 'Deceased Contact', 'John Smith', true) //
      .selectIsApprovedVisitor('YES')
      .clickContinue()

    Page.verifyOnPage(RelationshipCommentsPage, 'Deceased Contact', 'John Smith', true) //
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .verifyShowsNameAs('Deceased Contact (654321)')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: `/prisoner-contact`,
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: true,
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Cancelling from check answers prompts for confirmation', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
      employments: [],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .continueTo(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'Existing Contact', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NONE')
      .continueTo(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true) //
      .selectIsApprovedVisitor('YES')
      .continueTo(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .enterComments('Some comments about the relationship')
      .continueTo(LinkExistingContactCYAPage) //
      .clickLink('Cancel')

    Page.verifyOnPage(CancelAddContactPage, 'Existing Contact') //
      .clickButtonTo('No, return to check answers', LinkExistingContactCYAPage)
      .clickLinkTo('Cancel', CancelAddContactPage, 'Existing Contact')
      .clickButton('Yes, cancel')

    Page.verifyOnPage(ListContactsPage, 'John Smith')
  })
})
