import SearchPrisonerPage from '../pages/searchPrisoner'
import Page from '../pages/page'

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

  it('User can manage their contacts', () => {
    Page.verifyOnPage(SearchPrisonerPage)
    cy.get('[data-test="search"]').should('be.visible')
    cy.get('[data-test="search"]').click()
    cy.get('.govuk-error-summary__title').should('be.visible')
    cy.get('.govuk-list > li > a').should('be.visible')
    cy.get('#search-error').should('be.visible')
    cy.get('#search').type('Ehshapeter', { force: true })
    // cy.get('[data-test="search"]').click()
  })
})
