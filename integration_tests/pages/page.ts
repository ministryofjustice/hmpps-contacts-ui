export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  static verifyOnPage<T>(constructor: new (...args: any) => T, ...args: any): T {
    return new constructor(args)
  }

  protected constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  hasFieldInError(field: string, expectedError: string) {
    cy.get(`#${Cypress.$.escapeSelector(field)}-error`).should('contain.text', expectedError)
    return this
  }

  get errorSummaryItems(): PageElement {
    return this.errorSummary.find('.govuk-error-summary__list a')
  }

  get errorSummary(): PageElement {
    return cy.get('.govuk-error-summary')
  }
}
