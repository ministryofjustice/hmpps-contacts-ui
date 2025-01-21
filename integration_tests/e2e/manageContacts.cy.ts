import SearchPrisonerPage from '../pages/searchPrisoner'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'
import SelectSpokenLanguagePage from '../pages/selectSpokenLanguagePage'

context('Manage contacts ', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubComponentsMeta')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it('Start of journey prompts for search', () => {
    Page.verifyOnPage(SearchPrisonerPage)
      .verifyShowContactsCaptionAsValue('Contacts')
      .verifyShowContactsHeaderAsValue('Search for a prisoner')
      .verifySearchFormLabelIsVisible()
      .verifySearchSearchButtonIsVisible()
  })

  it('Should show validation error for empty search term', () => {
    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    cy.get('[data-test="search"]').should('be.visible')
    searchPrisonerPage.prisonerSearchFormField().clear()
    searchPrisonerPage.prisonerSearchSearchButton().click()
    cy.get('.govuk-error-summary__title').should('be.visible')
    cy.get('.govuk-list > li > a').should('be.visible')
    cy.get('#search-error').should('be.visible')
  })

  it('Should show validation error for less than 2 characters entered', () => {
    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type('a')
    searchPrisonerPage.prisonerSearchSearchButton().click()
    cy.get('.govuk-error-summary__title').should('be.visible')
    cy.get('.govuk-list > li > a').should('be.visible')
    cy.get('#search-error').should('be.visible')
  })

  it('should show clickable search results for a prisoner', () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', 'A1234BC')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage)
      .clickActiveSectionTabButton()
      .verifyShowPaginationNavigationValueAs('Next')
      .verifyShowPaginationNavigationValueAs('Previous')
      .verifyShowPaginationPageLinkValueAs('1', 1)
      .verifyShowPaginationPageValueAs('…')
      .verifyShowPaginationPageLinkValueAs('3', 2)
      .verifyShowPaginationActivePageValueAs('4')
      .verifyShowPaginationPageLinkValueAs('5', 3)
      .verifyShowPaginationPageLinkValueAs('5', 4)
      .clickInactiveSectionTabButton()
      .verifyShowPaginationNavigationValueAs('Next')
      .verifyShowPaginationNavigationValueAs('Previous')
      .verifyShowPaginationPageLinkValueAs('1', 1)
      .verifyShowPaginationPageValueAs('…')
      .verifyShowPaginationPageLinkValueAs('3', 2)
      .verifyShowPaginationActivePageValueAs('4')
      .verifyShowPaginationPageLinkValueAs('5', 4)
  })

  it(`should render manage contact details`, () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubGetGenders')
    cy.task('stubTitlesReferenceData')
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', TestData.contact())
    cy.task('stubGetPrisonerContactRelationshipById', { id: 31, response: TestData.prisonerContactRelationship() })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubContactList', 'A1234BC')
    cy.task('stubLanguagesReferenceData')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
      .verifyShowNamesValueAs('Mr Jones Mason')
      .verifyShowDOBValueAs('14 January 1990')
      .verifyShowMostRelevantAddressLabelValueAs('Primary')
      .verifyShowConfirmAddressValueAs('24, Acacia Avenue')
      .verifyShowConfirmAddressValueAs('Bunting')
      .verifyShowConfirmAddressValueAs('Sheffield')
      .verifyShowConfirmAddressValueAs('South Yorkshire')
      .verifyShowConfirmAddressValueAs('England')
      .verifyShowSpokenLanguageValueAs('English')
      .verifyShowIdentityNumberValueAs('LAST-87736799M', 'DL')
      .verifyShowIdentityNumberValueAs('425362965', 'PASS')
      .verifyShowIdentityNumberValueAs('06/614465M', 'NINO')
      .verifyEmailValueAs('mr.last@example.com', 1)
      .verifyEmailValueAs('mr.first@example.com', 2)
      .verifyShowStaffStatusValueAs('No')
      .clickChangeSpokenLanguageLink()

    Page.verifyOnPage(SelectSpokenLanguagePage, 'Jones Mason')
  })

  it(`should render deceased date when available`, () => {
    const { prisonerNumber } = TestData.prisoner()
    const contact = {
      ...TestData.contact(),
      dateOfBirth: null,
      deceasedDate: '2020-11-22',
    }
    cy.task('stubGetGenders')
    cy.task('stubTitlesReferenceData')
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubGetContactById', contact)
    cy.task('stubGetPrisonerContactRelationshipById', { id: 31, response: TestData.prisonerContactRelationship() })
    cy.task('stubGetPrisonerContactRestrictions', {
      prisonerContactId: 31,
      response: {
        prisonerContactRestrictions: [],
        contactGlobalRestrictions: [],
      },
    })
    cy.task('stubContactList', 'A1234BC')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Jones Mason')
      .verifyShowNamesValueAs('Mr Jones Mason')
      .verifyShowDeceasedDateValueAs('22 November 2020')
  })

  it('should show a message that no contacts match the criteria', () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', { term: prisonerNumber }) // Empty search result

    Page.verifyOnPage(SearchPrisonerPage)
      .enterPrisoner(prisonerNumber)
      .clickSearchButton()
      .verifyShowMessageAsValue('There are no results for this name or number at HMP Hewell')
  })
})
