import { PageElement } from './page'
import ContinuablePage from './continuablePage'

export default class EnterContactDateOfBirthPage extends ContinuablePage {
  constructor(name: string) {
    super(`Do you know ${name}'s date of birth?`)
  }

  selectIsKnown(value: 'YES' | 'NO'): EnterContactDateOfBirthPage {
    this.radio(value).click()
    return this
  }

  enterDay(day: string): EnterContactDateOfBirthPage {
    this.dayTextBox().clear().type(day)
    return this
  }

  enterMonth(month: string): EnterContactDateOfBirthPage {
    this.monthTextBox().clear().type(month)
    return this
  }

  enterYear(year: string): EnterContactDateOfBirthPage {
    this.yearTextBox().clear().type(year)
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)

  private dayTextBox = (): PageElement => cy.get('#day')

  private monthTextBox = (): PageElement => cy.get('#month')

  private yearTextBox = (): PageElement => cy.get('#year')
}
