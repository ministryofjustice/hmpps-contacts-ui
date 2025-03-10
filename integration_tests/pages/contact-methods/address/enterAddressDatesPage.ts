import Page, { PageElement } from '../../page'

export default class EnterAddressDatesPage extends Page {
  constructor(name: string, isEdit: boolean = false) {
    super(
      isEdit
        ? `Change the dates for ${name}’s use of this address`
        : `Enter the dates for ${name}’s use of this address`,
    )
  }

  hasFromMonth(value: string) {
    this.fromMonthTextbox().should('have.value', value)
    return this
  }

  enterFromMonth(value: string) {
    this.clearFromMonth()
    this.fromMonthTextbox().type(value, { delay: 0 })
    return this
  }

  clearFromMonth() {
    this.fromMonthTextbox().clear()
    return this
  }

  hasFromYear(value: string) {
    this.fromYearTextbox().should('have.value', value)
    return this
  }

  enterFromYear(value: string) {
    this.clearFromYear()
    this.fromYearTextbox().type(value, { delay: 0 })
    return this
  }

  clearFromYear() {
    this.fromYearTextbox().clear()
    return this
  }

  hasToMonth(value: string) {
    this.toMonthTextbox().should('have.value', value)
    return this
  }

  enterToMonth(value: string) {
    this.clearToMonth()
    this.toMonthTextbox().type(value, { delay: 0 })
    return this
  }

  clearToMonth() {
    this.toMonthTextbox().clear()
    return this
  }

  hasToYear(value: string) {
    this.toYearTextbox().should('have.value', value)
    return this
  }

  enterToYear(value: string) {
    this.clearToYear()
    this.toYearTextbox().type(value, { delay: 0 })
    return this
  }

  clearToYear() {
    this.toYearTextbox().clear()
    return this
  }

  private fromMonthTextbox = (): PageElement => cy.get('#fromMonth')

  private fromYearTextbox = (): PageElement => cy.get('#fromYear')

  private toMonthTextbox = (): PageElement => cy.get('#toMonth')

  private toYearTextbox = (): PageElement => cy.get('#toYear')
}
