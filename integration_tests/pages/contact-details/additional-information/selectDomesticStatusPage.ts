import Page, { PageElement } from '../../page'

export default class SelectDomesticStatusPage extends Page {
  constructor(name: string, isOptional: boolean = false) {
    let title = `What is ${name}’s domestic status?`
    if (isOptional) {
      title += ' (optional)'
    }
    super(title)
  }

  verifyDomesticStatus(value: string): SelectDomesticStatusPage {
    cy.get('.govuk-radios__input:checked').should('have.value', value)
    return this
  }

  selectDomesticStatus(value: string): SelectDomesticStatusPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: string): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
