import { v4 as uuidv4 } from 'uuid'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ContactConfirmationPage from '../pages/contactConfirmationPage'

const SELECT_IS_THE_RIGHT_PERSON_MESSAGE = 'Select whether this is the right contact'
const { prisonerNumber } = TestData.prisoner()
const contactId = 654321
const contact = TestData.contacts({ id: contactId, lastName: 'Contact', firstName: 'Existing', middleName: '' })
const journeyId = uuidv4()

context('Contact confirmation', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubTitlesReferenceData')
    cy.task('stubRelationshipReferenceData')
    cy.task('stubComponentsMeta')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
    cy.task('stubGetContactById', contact)
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.contacts()],
      },
      lastName: 'Mason',
      firstName: '',
      middleName: '',
      dateOfBirth: '',
    })

    cy.signIn()

    cy.visit(`/prisoner/${prisonerNumber}/contacts/search/${journeyId}`)
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Mason')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()
    searchContactPage.clickTheContactLink(13)
    Page.verifyOnPage(ContactConfirmationPage)
  })

  it(`should render contact confirmation page`, () => {
    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage)
    contactConfirmationPage.verifyShowsContactDetailsTabTitleAs('Contact details')
    contactConfirmationPage.verifyShowsRestrictionsTabTitleAs('Restrictions')
    contactConfirmationPage.verifyShowsLinkedOffendersTabTitleAs('Linked offenders')
    contactConfirmationPage.verifyShowsBasicDetailsCardTitleAs('Basic details')
    contactConfirmationPage.verifyShowsAddressesCardTitleAs('Addresses')
    contactConfirmationPage.verifyShowsPhoneNumbersCardTitleAs('Phone numbers')
    contactConfirmationPage.verifyShowsEmailAddressesCardTitleAs('Email addresses')
    contactConfirmationPage.verifyShowsIdentityNumbersCardTitleAs('Identity numbers')
    contactConfirmationPage.verifyShowsLanguangeDetailsCardTitleAs('Language details')
    contactConfirmationPage.verifyShowsIsTheRightPersonYesRadioTitleAs('Yes, this is the right person')
    contactConfirmationPage.verifyShowsIsTheRightPersonNoRadioTitleAs('No, this is not the right person')
    contactConfirmationPage.verifyContinueButtonTitleAs('Continue')
  })

  it(`should not pass validation when radiobox is not selected`, () => {
    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage)
    contactConfirmationPage.clickTheContinueButton()

    contactConfirmationPage.hasFieldInError('isContactConfirmed', SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    contactConfirmationPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(SELECT_IS_THE_RIGHT_PERSON_MESSAGE)
    })
  })

  it(`should navigate to next page when 'Yes, this is the right person' is selected `, () => {
    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage)
    contactConfirmationPage.selectIsTheRightPersonYesRadio()
    contactConfirmationPage.clickTheContinueButton()
  })

  it(`should navigate back to previous page when 'No, this is not the right person' is selected `, () => {
    const contactConfirmationPage = Page.verifyOnPage(ContactConfirmationPage)
    contactConfirmationPage.selectIsTheRightPersonNoRadio()
    contactConfirmationPage.clickTheContinueButton()
  })
})
