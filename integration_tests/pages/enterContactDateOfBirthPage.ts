import Page, { PageElement } from './page'

export default class EnterContactDateOfBirthPage extends Page {
  constructor(name: string) {
    super(`Do you know ${name}'s date of birth?`)
  }

  selectIsDobKnown(value: boolean): EnterContactDateOfBirthPage {
    this.radio(value).click()
    return this
  }

  enterDay(day: string): EnterContactDateOfBirthPage {
    this.dayTextBox().type(day)
    return this
  }

  enterMonth(month: string): EnterContactDateOfBirthPage {
    this.monthTextBox().type(month)
    return this
  }

  enterYear(year: string): EnterContactDateOfBirthPage {
    this.yearTextBox().type(year)
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private radio = (value: boolean): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)

  private dayTextBox = (): PageElement => cy.get('#day')

  private monthTextBox = (): PageElement => cy.get('#month')

  private yearTextBox = (): PageElement => cy.get('#year')
}
