import Page, { PageElement } from '../page'

export default class DateOfDeathPage extends Page {
  constructor(name: string, mode: 'RECORD' | 'CHANGE') {
    super(mode === 'RECORD' ? `Record the date of death for ${name}` : `Change the date of death for ${name}`)
  }

  enterDay(day: string) {
    this.dayTextBox().clear().type(day, { delay: 0 })
    return this
  }

  hasDay(day: string) {
    this.dayTextBox().should('have.value', day)
    return this
  }

  enterMonth(month: string) {
    this.monthTextBox().clear().type(month, { delay: 0 })
    return this
  }

  hasMonth(month: string) {
    this.monthTextBox().should('have.value', month)
    return this
  }

  enterYear(year: string) {
    this.yearTextBox().clear().type(year, { delay: 0 })
    return this
  }

  hasYear(year: string) {
    this.yearTextBox().should('have.value', year)
    return this
  }

  private dayTextBox = (): PageElement => cy.get('#day')

  private monthTextBox = (): PageElement => cy.get('#month')

  private yearTextBox = (): PageElement => cy.get('#year')
}
