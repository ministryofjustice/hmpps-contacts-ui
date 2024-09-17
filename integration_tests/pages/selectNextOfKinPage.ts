import Page, { PageElement } from './page'

export default class SelectNextOfKinPage extends Page {
  constructor(name: string) {
    super(`Is ${name} next of kin for the prisoner?`)
  }

  selectIsNextOfKin(value: 'YES' | 'NO'): SelectNextOfKinPage {
    this.radio(value).click()
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
