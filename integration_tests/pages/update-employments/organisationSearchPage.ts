import Page from '../page'

export default class OrganisationSearchPage extends Page {
  constructor(name: string) {
    super(`Search for ${name}’s employer`)
  }

  searchTerm() {
    return cy.findByRole('textbox', { name: /Name of organisation/ })
  }

  clickSearch() {
    cy.findByRole('button', { name: 'Search' }).click()
  }

  toHaveNumberOfResults(count: number) {
    cy.findAllByRole('link', { name: /Check if this is the correct employer/ }).should('have.length', count)
  }

  selectEmployer(employerName) {
    cy.findByRole('link', { name: `Check if this is the correct employer (${employerName})` }).click()
  }
}
