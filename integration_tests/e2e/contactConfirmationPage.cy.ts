import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SelectRelationshipPage from '../pages/selectRelationshipPage'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'

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

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John') //
      .selectIsTheRightPersonYesRadio()
      .clickContinue()
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

    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
    contactConfirmationPage.clickContinue()

    contactConfirmationPage.hasFieldInError('isContactConfirmed', SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    contactConfirmationPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    })
  })

  it(`should render contact information`, () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
      .verifyShowsTabTitleAs('Contact details', 0)
      .verifyShowsTabTitleAs('Restrictions', 1)
      .verifyShowsTabTitleAs('Linked offenders', 2)
      .verifyShowsCardTitleAs('Basic details', 0)
      .verifyShowNamesValueAs('Contact, Mr Existing')
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
      .verifyShowCommentsValueAs('Not provided')
      .verifyShowFromStartDateValueAs('January 2020')
      .verifyShowToEndDateValueAs('March 2029')
      .verifyShowPhoneNumbersValueAs('07878 111111', 'MOBILE')
      .verifyShowPhoneNumbersValueAs('01111 777777', 'HOME')
      .verifyShowsCardTitleAs('Email addresses', 3)
      .verifyShowEmalAddressValueAs('mr.last@example.com')
      .verifyShowEmalAddressValueAs('mr.first@example.com')
      .verifyShowsCardTitleAs('Identity numbers', 4)
      .verifyShowIdentityNumberValueAs('LAST-87736799M', 'DRIVING_LIC')
      .verifyShowIdentityNumberValueAs('425362965', 'PASSPORT')
      .verifyShowIdentityNumberValueAs('06/614465M', 'NI_NUMBER')
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
          ...TestData.address,
          comments: '',
          phoneNumbers: [],
          startDate: null,
          endDate: null,
        },
      ],
    })

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
      .verifyShowDeceasedDateValueAs('Not provided')
      .verifyShowCommentsValueAs('Not provided')
      .verifyShowAddressesSpecificPhoneNumbersValueAsNotProvided('Not provided')
      .verifyShowAddressFromToDateValueAsNotProvided('Not provided')
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

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John')
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

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John').selectIsTheRightPersonNoRadio().clickContinue()

    Page.verifyOnPage(SearchContactPage)
  })

  it('should navigate to relationship screen when "Yes, this is the right person" is selected ', () => {
    cy.task('stubGetContactById', TestData.contact())

    Page.verifyOnPage(SearchContactPage) //
      .clickTheContactLink(contactId)

    Page.verifyOnPage(ContactConfirmationPage, 'Smith, John').selectIsTheRightPersonYesRadio().clickContinue()

    Page.verifyOnPage(SelectRelationshipPage, 'Contact, Existing') //
  })
})
