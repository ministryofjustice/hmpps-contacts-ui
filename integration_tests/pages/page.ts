import { checkAxeAccessibility } from '../support/accessibilityViolations'

export type PageElement = Cypress.Chainable<JQuery>

type PageConfig = {
  skipA11yCheck: boolean
}

export default abstract class Page {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  static verifyOnPage<T>(constructor: new (...args: any) => T, ...args: any): T {
    return new constructor(...args)
  }

  protected constructor(
    private readonly title: string,
    private readonly config: PageConfig = { skipA11yCheck: false },
  ) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)

    if (!this.config.skipA11yCheck) {
      checkAxeAccessibility()
    }
  }

  signOut = (): PageElement => cy.findByRole('link', { name: /sign out/i })

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  headerUserName = (): PageElement => cy.get('[data-qa=connect-dps-common-header-user-name]')

  hasFieldInError(field: string, expectedError: string) {
    cy.get(`#${Cypress.$.escapeSelector(field)}-error`).should('contain.text', expectedError)
    return this
  }

  hasFieldHighlightedWithError(field: string) {
    cy.get(`#${Cypress.$.escapeSelector(field)}`).should('have.class', 'govuk-input--error')
    return this
  }

  get errorSummaryItems(): PageElement {
    return this.errorSummary.find('.govuk-error-summary__list a')
  }

  get errorSummary(): PageElement {
    return cy.get('.govuk-error-summary')
  }

  clickContinue() {
    this.continueButton().click()
  }

  clickBackLink() {
    this.backLink().click()
  }

  clickCancelLink() {
    this.cancelLink().click()
  }

  clickButton(name: string) {
    cy.findByRole('button', { name }).click()
  }

  clickLink(name: string) {
    cy.findByRole('link', { name }).click()
  }

  clickIndexedLink(index: number, name: string) {
    cy.findAllByRole('link', { name }).eq(index).click()
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  continueTo<T>(constructor: new (...args: any) => T, ...args: any): T {
    this.clickContinue()
    return new constructor(...args)
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  backTo<T>(constructor: new (...args: any) => T, ...args: any): T {
    this.clickBackLink()
    return new constructor(...args)
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  cancelTo<T>(constructor: new (...args: any) => T, ...args: any): T {
    this.clickCancelLink()
    return new constructor(...args)
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  clickButtonTo<T>(name: string, constructor: new (...args: any) => T, ...args: any): T {
    this.clickButton(name)
    return new constructor(...args)
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  clickLinkTo<T>(name: string, constructor: new (...args: any) => T, ...args: any): T {
    this.clickLink(name)
    return new constructor(...args)
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  clickIndexedLinkTo<T>(index: number, name: string, constructor: new (...args: any) => T, ...args: any): T {
    this.clickIndexedLink(index, name)
    return new constructor(...args)
  }

  hasSuccessBanner(expected: string) {
    this.successBanner().should('contain.text', expected)
    return this
  }

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private backLink = (): PageElement => cy.get('[data-qa=back-link]')

  private cancelLink = (): PageElement => cy.get('[data-qa=cancel-button]')

  private successBanner = (): PageElement => cy.get('.govuk-notification-banner__heading')
}
