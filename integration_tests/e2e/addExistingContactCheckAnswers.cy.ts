import Page from '../pages/page'
import LinkExistingContactCYAPage from '../pages/linkExistingContactCYAPage'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'
import AddContactSuccessPage from '../pages/addContactSuccessPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import RelationshipCommentsPage from '../pages/contact-details/relationship/relationshipCommentsPage'
import SelectApprovedVisitorPage from '../pages/contact-details/relationship/selectApprovedVisitorPage'
import SelectEmergencyContactOrNextOfKinPage from '../pages/contact-details/relationship/selectEmergencyContactOrNextOfKinPage'

context('Add Existing Contact Check Answers', () => {
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
    cy.task('stubAddContactRelationship', { contactId, createdPrisonerContactId: 654321 })
    cy.task('stubGetGlobalRestrictions', [globalRestriction])
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [searchResult],
      },
      lastName: 'FOO',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    cy.signIn()
    cy.visit(`/prisoner/${prisonerNumber}/contacts/list`)

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('FOO')
      .clickSearchButton()

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
      .selectRelationshipType('S')
      .continueTo(SelectRelationshipPage, 'Existing Contact', 'John Smith') //
      .selectRelationship('MOT')
      .continueTo(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('NOK')
      .continueTo(SelectApprovedVisitorPage, 'Existing Contact', 'John Smith', true) //
      .selectIsApprovedVisitor('NO')
      .continueTo(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .enterComments('Some comments about the relationship')
      .continueTo(LinkExistingContactCYAPage) //
      .verifyShowsNameAs('Existing Contact (654321)')
      .verifyShowRelationshipAs('Mother')
      .verifyShowIsEmergencyContactAs('No')
      .verifyShowIsNextOfKinAs('Yes')
      .verifyShowCommentsAs('Some comments about the relationship')
  })

  it('Can change emergency contact or next of kin from check answers', () => {
    Page.verifyOnPage(LinkExistingContactCYAPage, 'Existing Contact') //
      .verifyShowIsEmergencyContactAs('No')
      .clickChangeEmergencyContactLink()

    Page.verifyOnPage(SelectEmergencyContactOrNextOfKinPage, 'Existing Contact', 'John Smith', true) //
      .selectIsEmergencyContactOrNextOfKin('EC')
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .verifyShowIsEmergencyContactAs('Yes')
      .verifyShowIsNextOfKinAs('No')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/prisoner-contact',
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: false,
          isEmergencyContact: true,
          isApprovedVisitor: false,
          comments: 'Some comments about the relationship',
        },
        createdBy: 'USER1',
      },
    )
  })

  it('Can change relationship comments from check answers', () => {
    Page.verifyOnPage(LinkExistingContactCYAPage, 'Existing Contact') //
      .verifyShowCommentsAs('Some comments about the relationship')
      .clickChangeCommentsLink()

    Page.verifyOnPage(RelationshipCommentsPage, 'Existing Contact', 'John Smith', true) //
      .enterComments('Some updated comments')
      .clickContinue()

    Page.verifyOnPage(LinkExistingContactCYAPage) //
      .verifyShowCommentsAs('Some updated comments')
      .continueTo(AddContactSuccessPage)

    cy.verifyLastAPICall(
      {
        method: 'POST',
        urlPath: '/prisoner-contact',
      },
      {
        contactId,
        relationship: {
          prisonerNumber: 'A1234BC',
          relationshipTypeCode: 'S',
          relationshipToPrisonerCode: 'MOT',
          isNextOfKin: true,
          isEmergencyContact: false,
          isApprovedVisitor: false,
          comments: 'Some updated comments',
        },
        createdBy: 'USER1',
      },
    )
  })
})
