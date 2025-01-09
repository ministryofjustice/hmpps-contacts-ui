import Page, { PageElement } from './page'

export default class EnterContactDateOfBirthPage extends Page {
  constructor(name: string) {
    super(`Do you know ${name}'s date of birth?`)
  }

  selectIsKnown(value: 'YES' | 'NO'): EnterContactDateOfBirthPage {
    this.radio(value).click()
    return this
  }

  hasIsKnown(value: 'YES' | 'NO'): EnterContactDateOfBirthPage {
    this.radio(value).should('be.checked')
    return this
  }

  enterDay(day: string): EnterContactDateOfBirthPage {
    this.dayTextBox().clear().type(day)
    return this
  }

  hasDay(day: string): EnterContactDateOfBirthPage {
    this.dayTextBox().should('have.value', day)
    return this
  }

  enterMonth(month: string): EnterContactDateOfBirthPage {
    this.monthTextBox().clear().type(month)
    return this
  }

  hasMonth(month: string): EnterContactDateOfBirthPage {
    this.monthTextBox().should('have.value', month)
    return this
  }

  enterYear(year: string): EnterContactDateOfBirthPage {
    this.yearTextBox().clear().type(year)
    return this
  }

  hasYear(year: string): EnterContactDateOfBirthPage {
    this.yearTextBox().should('have.value', year)
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)

  private dayTextBox = (): PageElement => cy.get('#day')

  private monthTextBox = (): PageElement => cy.get('#month')

  private yearTextBox = (): PageElement => cy.get('#year')
}
