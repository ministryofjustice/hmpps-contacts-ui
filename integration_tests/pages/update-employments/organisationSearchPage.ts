import Page from '../page'

export default class OrganisationSearchPage extends Page {
  constructor() {
    super('Check if the employer organisation is already on the system')
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
