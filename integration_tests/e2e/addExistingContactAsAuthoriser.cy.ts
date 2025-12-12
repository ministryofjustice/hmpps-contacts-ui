import Page from '../pages/page'
import LinkExistingContactCYAPage from '../pages/linkExistingContactCYAPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactMatchPage from '../pages/contactMatchPage'
import AddContactSuccessPage from '../pages/addContactSuccessPage'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'

context('Add existing contact as authorising user so can set visit approval', () => {
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
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_AUTHORISER'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubOfficialRelationshipReferenceData')
    cy.task('stubRelationshipTypeReferenceData')
    cy.task('stubPhoneTypeReferenceData')
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
    cy.task('stubGetPrisonerRestrictions', {
      prisonerNumber,
      response: {
        content: [],
      },
    })
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubGetContactHistory', { contactId, history: [] })
    cy.task('stubAddContactRelationship', { contactId, createdPrisonerContactId: prisonerContactId })
    cy.task('stubContactAdvancedSearch', {
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

    cy.task('stubAllSummariesForAPrisonerAndContact', {
      prisonerNumber,
      contactId,
      items: [],
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

    Page.verifyOnPage(ContactMatchPage, 'Existing Contact', 'John Smith') //
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

    Page.verifyOnPage(ContactMatchPage, 'Existing Contact', 'John Smith') //
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
      },
    )
  })

  it('Can navigate all the way back to search from CYA', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactMatchPage, 'Existing Contact', 'John Smith') //
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
      .backTo(ContactMatchPage, 'Existing Contact', 'John Smith')
      .backTo(SearchContactPage)
      .verifyShowsNameAs('Contact, Existing')
  })
})
