import Page, { PageElement } from '../page'

export default class ContactDetailsDobPage extends Page {
  constructor(name: string, isOptional: boolean = false) {
    let title = `What is ${name}’s date of birth?`
    if (isOptional) {
      title += ' (optional)'
    }
    super(title)
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
