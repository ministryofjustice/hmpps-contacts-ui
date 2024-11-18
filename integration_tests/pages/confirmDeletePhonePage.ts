import Page, { PageElement } from './page'

export default class ConfirmDeletePhonePage extends Page {
  constructor() {
    super(`Are you sure you want to delete this phone number?`)
  }

  hasPhoneNumber(value: string): ConfirmDeletePhonePage {
    this.phoneNumberValue().should('contain.text', value)
    return this
  }

  hasType(value: string): ConfirmDeletePhonePage {
    this.typeValue().should('contain.text', value)
    return this
  }

  hasExtension(value: string): ConfirmDeletePhonePage {
    this.extensionValue().should('contain.text', value)
    return this
  }

  private phoneNumberValue = (): PageElement => cy.get('.phone-number-value')

  private extensionValue = (): PageElement => cy.get('.extension-value')

  private typeValue = (): PageElement => cy.get('.type-value')
}
