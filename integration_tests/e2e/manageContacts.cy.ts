import SearchPrisonerPage from '../pages/searchPrisoner'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'

context('Manage contacts ', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
    cy.visit('/contacts/manage/prisoner-search/start')
  })

  it('Start of journey prompts for search', () => {
    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.manageContactsCaption().should('contain.text', 'Manage Contacts')
    searchPrisonerPage.manageContactH1().should('contain.text', 'Search for a prisoner')
    searchPrisonerPage.prisonerSearchFormLabel().should('be.visible')
    searchPrisonerPage.prisonerSearchSearchButton().should('be.visible')
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

    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
    searchPrisonerPage.prisonerSearchSearchButton().click()
    Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.clickPrisonerLink()
    Page.verifyOnPage(ListContactsPage)
      .verifyShowPaginationNavigationValueAs('Next', 'next')
      .verifyShowPaginationPageLinkValueAs('1', 0)
      .verifyShowPaginationPageLinkValueAs('3', 2)
      .verifyShowPaginationPageLinkValueAs('4', 3)
      .verifyShowPaginationPageLinkValueAs('5', 4)
      .verifyShowPaginationNavigationValueAs('Previous', 'previous')
  })

  it('should show a message that no contacts match the criteria', () => {
    const { prisonerNumber } = TestData.prisoner()
    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', { term: prisonerNumber }) // Empty search result
    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
    searchPrisonerPage.prisonerSearchSearchButton().click()
    Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage
      .noResultMessage()
      .should('contain.text', 'There are no results for this name or number at HMP Hewell')
  })
})
