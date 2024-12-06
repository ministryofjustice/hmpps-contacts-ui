import Page, { PageElement } from './page'

export default class SelectAddressTypePage extends Page {
  constructor(name: string) {
    super(`What type of address do you want to add for ${name}?`)
  }

  isEmptyForm(): SelectAddressTypePage {
    this.radio('HOME').should('not.be.checked')
    this.radio('WORK').should('not.be.checked')
    this.radio('BUS').should('not.be.checked')
    this.radio('DO_NOT_KNOW').should('not.be.checked')
    return this
  }

  hasAddressType(value: string): SelectAddressTypePage {
    this.radio(value).should('be.checked')
    return this
  }

  selectAddressType(value: string): SelectAddressTypePage {
    this.radio(value).click()
    return this
  }

  private radio = (value: string): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
