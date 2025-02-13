import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'
import SelectRelationshipTypePage from '../pages/selectRelationshipTypePage'

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
          middleNames: 'The Hatchet',
          relationships: [
            TestData.getLinkedPrisonerRelationshipDetails({
              prisonerContactId: 3,
            }),
          ],
        }),
      ],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'John Smith') //
      .hasLinkedPrisonersCount(2)
      .clickLinkedPrisonersTab()
      .hasLinkedPrisonersCardTitle('R6548ST', 'Last, First')
      .hasLinkedPrisonersNomsValue('R6548ST', 'R6548ST')
      .hasLinkedPrisonersRelationshipValue('R6548ST', 'Social/Family - FriendOfficial - Doctor')
      .hasLinkedPrisonersCardTitle('X7896YZ', 'Smith, John The Hatchet')
      .hasLinkedPrisonersNomsValue('X7896YZ', 'X7896YZ')
      .hasLinkedPrisonersRelationshipValue('X7896YZ', 'Social/Family - Friend')
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
    cy.task('stubGetContactById', TestData.contact())
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
      .verifyShowAddressValueAs('24,')
      .verifyShowAddressValueAs('Acacia Avenue')
      .verifyShowAddressValueAs('Bunting')
      .verifyShowAddressValueAs('Sheffield')
      .verifyShowAddressValueAs('South Yorkshire')
      .verifyShowAddressValueAs('England')
      .verifyShowAddressTypeValueAs('Home')
      .verifyShowsCardTitleAs('Phone numbers', 2)
      .verifyShowAddressSpecificPhoneValueAs('Home: 01111 777777 (+0123)', 'HOME')
      .verifyShowEmailValueAs('No')
      .verifyShowCommentsValueAs('Some comments')
      .verifyShowFromStartDateValueAs('January 2020')
      .verifyShowPhoneNumbersValueAs('07878 111111', 'MOBILE')
      .verifyShowPhoneNumbersValueAs('01111 777777', 'HOME')
      .verifyShowsCardTitleAs('Email addresses', 3)
      .verifyShowEmalAddressValueAs('mr.last@example.com')
      .verifyShowEmalAddressValueAs('mr.first@example.com')
      .verifyShowsCardTitleAs('Identity numbers', 4)
      .verifyShowIdentityNumberValueAs('LAST-87736799M', 'DL')
      .verifyShowIdentityNumberValueAs('425362965', 'PASS')
      .verifyShowIdentityNumberValueAs('06/614465M', 'NINO')
      .verifyShowsCardTitleAs('Language details', 5)
      .verifyShowSpokenLanguageValueAs('English')
      .verifyShowNeedsInterpreterValueAs('No')
  })

  it('should render contact information with empity rows if not available', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      firstName: 'Existing',
      lastName: 'Contact',
      middleNames: 'Mr',
      dateOfBirth: '1990-01-14',
      isDeceased: false,
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

  it('should render contact information with empity sections if not available', () => {
    cy.task('stubGetContactById', {
      id: contactId,
      title: 'MR',
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
