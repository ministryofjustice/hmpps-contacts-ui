import Page, { PageElement } from './page'

export default abstract class ContinuablePage extends Page {
  protected constructor(title: string) {
    super(title)
  }

  clickContinue() {
    this.continueButton().click()
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  continueTo<T>(constructor: new (...args: any) => T, ...args: any): T {
    this.clickContinue()
    return new constructor(args)
  }

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')
}
