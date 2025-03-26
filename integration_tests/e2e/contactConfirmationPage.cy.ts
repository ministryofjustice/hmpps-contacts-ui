import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'
import { components } from '../../server/@types/contactsApi'

type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']
const SELECT_IS_THE_RIGHT_PERSON_MESSAGE = 'Select whether this is the right contact'

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
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubGetContactNameById', contact)
    cy.task('stubGetGlobalRestrictions', [globalRestriction])
    cy.task('stubGetLinkedPrisoners', { contactId, linkedPrisoners: [] })

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
    cy.visit(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)

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

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith') //
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

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith') //
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

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith') //
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

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith') //
      .hasLinkedPrisonersCount(35)
      .clickLinkedPrisonerTab()
      .hasLinkedPrisonerRow(1, 'A0BC')
      .clickPaginationLink('Page 2 of 4')
      .hasLinkedPrisonerRow(1, 'A10BC')
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

    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage, 'John Smith')
    contactConfirmationPage.clickContinue()

    contactConfirmationPage.hasFieldInError('isContactConfirmed', SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    contactConfirmationPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    })
  })

  it(`should render contact information`, () => {
    const titleHeader = 'Is this the right person to add as a contact for John Smith?'
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

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith')
      .verifyShowTitleHeaderValueAs(titleHeader, 'top')
      .verifyShowTitleHeaderValueAs(titleHeader, 'bottom')
      .verifyShowsTabTitleAs('Contact details', 0)
      .verifyShowsTabTitleAs('Restrictions', 1)
      .verifyShowsTabTitleAs('Linked prisoners', 2)
      .verifyShowsCardTitleAs('Basic details', 0)
      .verifyShowNamesValueAs('Contact, Mr Existing')
      .verifyShowGenderValueAs('Male')
      .verifyShowDOBValueAs('14 January 1990')
      .verifyShowDeceasedDateValueAs('Not provided')
      .verifyShowsCardTitleAs('Addresses', 1)
      .verifyShowAddressValueAs('24<br>Acacia Avenue<br>Bunting<br>Sheffield<br>South Yorkshire<br>S2 3LK<br>England')
      .verifyShowAddressTypeValueAs('Home')
      .verifyShowsCardTitleAs('Phone numbers', 2)
      .verifyShowAddressSpecificPhoneValueAs('Home: 01111 777777 (+0123)', 'HOME')
      .verifyShowEmailValueAs('No')
      .verifyShowCommentsValueAs('Some comments')
      .verifyShowFromStartDateValueAs('January 2020')
      .verifyShowPhoneNumbersValueAs('07878 111111', 'MOBILE')
      .verifyShowPhoneNumbersValueAs('01111 777777', 'HOME')
      .verifyShowsCardTitleAs('Email addresses', 3)
      .verifyShowEmailAddressValueAs('mr.last@example.com')
      .verifyShowEmailAddressValueAs('mr.first@example.com')
      .verifyShowsCardTitleAs('Identity numbers', 4)
      .verifyShowIdentityNumberValueAs('LAST-87736799M', 'DL')
      .verifyShowIdentityNumberValueAs('425362965', 'PASS')
      .verifyShowIdentityNumberValueAs('06/614465M', 'NINO')
      .verifyShowsCardTitleAs('Language details', 5)
      .verifyShowSpokenLanguageValueAs('English')
      .verifyShowNeedsInterpreterValueAs('No')
  })

  it('should render contact information with empty rows if not available', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      middleNames: 'Mr',
      dateOfBirth: '1990-01-14',
      deceasedDate: null,
      languageCode: null,
      languageDescription: null,
      interpreterRequired: false,
      addresses: [
        {
          ...TestData.address({}),
          comments: '',
          phoneNumbers: [],
          startDate: null,
          endDate: null,
        },
      ],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith')
      .verifyShowDeceasedDateValueAs('Not provided')
      .verifyShowCommentsValueAs('Not provided')
      .verifyShowAddressesSpecificPhoneNumbersValueAsNotProvided('Not provided')
      .verifyShowFromStartDateValueAs('Not provided')
  })

  it('should render contact information with empty sections if not available', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      titleCode: 'MR',
      titleDescription: 'Mr',
      firstName: 'Existing',
      lastName: 'Contact',
      middleNames: 'Middle',
      dateOfBirth: '1990-01-14',
      languageCode: null,
      languageDescription: null,
      interpreterRequired: false,
      addresses: [],
      phoneNumbers: [],
      emailAddresses: [],
      identities: [],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith')
      .verifyShowNamesValueAs('Contact, Mr Existing Middle')
      .verifyShowDOBValueAs('14 January 1990')
      .verifyShowDeceasedDateValueAs('Not provided')
      .verifyShowAddressesValueAsNotProvided('Not provided')
      .verifyShowPhoneNumbersValueAsNotProvided('Not provided')
      .verifyShowEmailAddressesValueAsNotProvided('Not provided')
      .verifyShowIdentitiesValueAsNotProvided('Not provided')
      .verifyShowSpokenLanguageValueAs('Not provided')
      .verifyShowNeedsInterpreterValueAs('No')
  })

  it('should navigate back to search contact when "No, this is not the right person" is selected ', () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith').selectIsTheRightPersonNoRadio().clickContinue()

    Page.verifyOnPage(SearchContactPage)
  })

  it('should navigate to relationship screen when "Yes, this is the right person" is selected ', () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith').selectIsTheRightPersonYesRadio().clickContinue()

    Page.verifyOnPage(SelectRelationshipTypePage, 'Existing Contact', 'John Smith') //
  })
})
