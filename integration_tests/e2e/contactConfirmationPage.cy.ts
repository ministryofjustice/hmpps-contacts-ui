import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import EnterNamePage from '../pages/enterNamePage'
import { LinkedPrisonerDetails } from '../../server/@types/contactsApiClient'

context('Contact confirmation', () => {
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
  const journeyId = uuidv4()

  const globalRestriction = TestData.getContactRestrictionDetails({ contactId: contact.id })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubPhoneTypeReferenceData')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
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
      lastName: 'Contact',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })

    cy.signIn({ startUrl: `/prisoner/${prisonerNumber}/contacts/search/${journeyId}` })

    Page.verifyOnPage(SearchContactPage) //
      .enterLastName('Contact')
      .clickSearchButton()
  })

  it('should render contact confirmation page', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .hasLinkedPrisonersCount(0)
      .selectIsTheRightPersonYesRadio()
      .clickContinue()
  })

  it('should render contact confirmation page with restrictions on restrictions tab', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .clickRestrictionsTab()
      .checkRestrictionsDetails()
      .selectIsTheRightPersonYesRadio()
      .clickContinue()
  })

  it('should render linked prisoners tab', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })
    cy.task('stubGetLinkedPrisoners', {
      contactId,
      linkedPrisoners: [
        TestData.getLinkedPrisonerDetails({
          prisonerNumber: 'R6548ST',
        }),
        TestData.getLinkedPrisonerDetails({
          prisonerNumber: 'X7896YZ',
          lastName: 'Smith',
          firstName: 'John',
          middleNames: 'Middle Names',
          prisonerContactId: 3,
          relationshipTypeCode: 'O',
          relationshipTypeDescription: 'Official',
          relationshipToPrisonerCode: 'DR',
          relationshipToPrisonerDescription: 'Doctor',
        }),
      ],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .hasLinkedPrisonersCount(2)
  })

  it('should render linked prisoners tab with pagination', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })
    const linkedPrisonersPage1: LinkedPrisonerDetails[] = Array(10)
      .fill(0)
      .map(
        (_, i) =>
          ({
            prisonerNumber: `A${i}BC`,
            lastName: `One`,
            firstName: 'Page',
            prisonId: 'BXI',
            prisonName: 'Brixton (HMP)',
            prisonerContactId: i,
            relationshipTypeCode: 'S',
            relationshipTypeDescription: 'Social/Family',
            relationshipToPrisonerCode: 'MOT',
            relationshipToPrisonerDescription: 'Mother',
            isRelationshipActive: true,
          }) as LinkedPrisonerDetails,
      )
    const linkedPrisonersPage2: LinkedPrisonerDetails[] = Array(10)
      .fill(0)
      .map(
        (_, i) =>
          ({
            prisonerNumber: `A${i + 10}BC`,
            lastName: `Two`,
            firstName: 'Page',
            prisonId: 'BXI',
            prisonName: 'Brixton (HMP)',
            prisonerContactId: i + 10,
            relationshipTypeCode: 'S',
            relationshipTypeDescription: 'Social/Family',
            relationshipToPrisonerCode: 'MOT',
            relationshipToPrisonerDescription: 'Mother',
            isRelationshipActive: true,
          }) as LinkedPrisonerDetails,
      )

    cy.task('stubGetLinkedPrisoners', {
      contactId,
      linkedPrisoners: linkedPrisonersPage1,
      pageNumber: 0,
      totalElements: 35,
    })

    cy.task('stubGetLinkedPrisoners', {
      contactId,
      linkedPrisoners: linkedPrisonersPage2,
      pageNumber: 1,
      totalElements: 35,
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith') //
      .hasLinkedPrisonersCount(35)
      .clickLinkedPrisonerTab()
      .hasLinkedPrisonerRow(0, 'A0BC')
      .clickPaginationLink('Page 2 of 4')
      .hasLinkedPrisonerRow(0, 'A10BC')
  })

  it(`should not pass validation when radiobox is not selected`, () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      dateOfBirth: '1990-01-14',
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith')
    contactConfirmationPage.clickContinue()

    const expectedMessage = 'Select if this is the correct contact or not'
    contactConfirmationPage.hasFieldInError('isContactMatched', expectedMessage)
    contactConfirmationPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(expectedMessage)
    })
  })

  it(`should render contact information`, () => {
    cy.task('stubGetContactById', {
      ...contact,
      addresses: [
        TestData.address({
          startDate: '2020-01-01',
        }),
      ],
    })
    cy.task('stubGetGenders')

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith')
      .verifyShowsTabTitleAs('Contact details', 0)
      .verifyShowsTabTitleAs('Contact methods', 1)
      .verifyShowsTabTitleAs('Professional information', 2)
      .verifyShowsTabTitleAs('Restrictions', 3)
      .verifyShowsTabTitleAs('Linked prisoners', 4)
  })

  it('should navigate back to search contact when "No, this is not the right person" is selected ', () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith')
      .selectIsTheRightPersonNoSearchAgainRadio()
      .clickContinue()

    Page.verifyOnPage(SearchContactPage)
  })

  it('should navigate to relationship screen when "Yes, this is the right person" is selected ', () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith')
      .selectIsTheRightPersonYesRadio()
      .clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
  })

  it('should navigate to enter name screen when "No, I need to add a new contact onto the system" is selected', () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Existing Contact', 'John Smith')
      .selectIsTheRightPersonNoCreateNewRadio()
      .clickContinue()

    Page.verifyOnPage(EnterNamePage, 'John Smith') //
  })
})
