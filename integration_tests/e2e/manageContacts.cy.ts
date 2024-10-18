import SearchPrisonerPage from '../pages/searchPrisoner'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'
import ManageContactDetailsPage from '../pages/manageContactDetails'

context('Manage contacts ', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it('Start of journey prompts for search', () => {
    Page.verifyOnPage(SearchPrisonerPage)
      .verifyShowContactsCaptionAsValue('Manage Contacts')
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
      .verifyShowPaginationNavigationValueAs('Next', 'next')
      .verifyShowPaginationNavigationValueAs('Previous', 'previous')
      .verifyShowPaginationPageLinkValueAs('1', 0)
      .verifyShowPaginationPageLinkValueAs('3', 2)
      .verifyShowPaginationPageLinkValueAs('4', 3)
      .verifyShowPaginationPageLinkValueAs('5', 4)
      .clickInactiveSectionTabButton()
      .verifyShowPaginationNavigationValueAs('Next', 'next')
      .verifyShowPaginationNavigationValueAs('Previous', 'previous')
      .verifyShowPaginationPageLinkValueAs('1', 0)
      .verifyShowPaginationPageLinkValueAs('3', 2)
      .verifyShowPaginationPageLinkValueAs('4', 3)
      .verifyShowPaginationPageLinkValueAs('5', 4)
  })

  it(`should render manage contact details`, () => {
    const { prisonerNumber } = TestData.prisoner()
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
    cy.task('stubContactList', 'A1234BC')

    Page.verifyOnPage(SearchPrisonerPage).enterPrisoner(prisonerNumber).clickSearchButton().clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage).clickContactNamesLink(22)

    Page.verifyOnPage(ManageContactDetailsPage, 'Mason, Jones')
      .verifyShowNamesValueAs('Mason, Mr Jones')
      .verifyShowDOBValueAs('14 January 1990')
      .verifyShowDeceasedDateValueAs('Not provided')
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
