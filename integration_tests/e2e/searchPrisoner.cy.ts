import SearchPrisonerPage from '../pages/searchPrisoner'
import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'

context('Contacts', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.signIn()
    cy.visit('/search/prisoner')
  })

  it('Contacts cards visible', () => {
    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.manageContactsCaption().should('contain.text', 'Manage Contacts')
    searchPrisonerPage.manageContactH1().should('contain.text', 'Search for a prisoner')
    searchPrisonerPage.prisonerSearchFormLabel().should('be.visible')
    searchPrisonerPage.prisonerSearchSearchButton().should('be.visible')
  })

  it('should shwow validation error', () => {
    Page.verifyOnPage(SearchPrisonerPage)
    cy.get('[data-test="search"]').should('be.visible')
    cy.get('[data-test="search"]').click()
    cy.get('.govuk-error-summary__title').should('be.visible')
    cy.get('.govuk-list > li > a').should('be.visible')
    cy.get('#search-error').should('be.visible')
    cy.get('#search').type('Ehshapeter', { force: true })
  })

  context('when there are results', () => {
    const { prisonerNumber } = TestData.prisoner()

    it('should show that there are no results', () => {
      cy.task('stubPrisoners', { term: prisonerNumber })

      const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)

      searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
      // searchPrisonerPage.prisonerSearchSearchButton().click()
    })
  })
})
