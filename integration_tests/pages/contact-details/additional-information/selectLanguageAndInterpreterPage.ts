import Page from '../../page'

export default class SelectLanguageAndInterpreterPage extends Page {
  constructor(private name: string) {
    super(`Enter language and interpretation requirements`)
  }

  verifyFirstLanguage(value: string) {
    cy.findByRole('combobox', { name: `What is ${this.name}’s first language?` }).should('have.value', value)
    return this
  }

  selectFirstLanguage(value: string) {
    cy.findByRole('combobox', { name: `What is ${this.name}’s first language?` }).type(value, { delay: 0 })
    return this
  }

  verifyIsInterpreterNeeded(value: 'YES' | 'NO') {
    cy.get('.govuk-radios__input:checked').should('have.value', value)
    return this
  }

  selectIsInterpreterNeeded(value: 'YES' | 'NO') {
    cy.get(`.govuk-radios__input[value='${value}']`).click()
    return this
  }
}
