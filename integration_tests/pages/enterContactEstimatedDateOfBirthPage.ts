import Page, { PageElement } from './page'

export default class EnterContactEstimatedDateOfBirthPage extends Page {
  constructor(name: string) {
    super(`Is ${name} over 18 years old?`)
  }

  selectIsOverEighteen(value: 'YES' | 'NO' | 'DO_NOT_KNOW'): EnterContactEstimatedDateOfBirthPage {
    this.radio(value).click()
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private radio = (value: 'YES' | 'NO' | 'DO_NOT_KNOW'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
