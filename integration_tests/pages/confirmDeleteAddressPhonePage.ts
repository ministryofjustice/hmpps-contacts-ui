import Page, { PageElement } from './page'

export default class ConfirmDeleteAddressPhonePage extends Page {
  constructor() {
    super(`Are you sure you want to delete this phone number?`)
  }

  hasPhoneNumber(value: string): ConfirmDeleteAddressPhonePage {
    this.phoneNumberValue().should('contain.text', value)
    return this
  }

  hasType(value: string): ConfirmDeleteAddressPhonePage {
    this.typeValue().should('contain.text', value)
    return this
  }

  hasExtension(value: string): ConfirmDeleteAddressPhonePage {
    this.extensionValue().should('contain.text', value)
    return this
  }

  private phoneNumberValue = (): PageElement => cy.get('.phone-number-value')

  private extensionValue = (): PageElement => cy.get('.extension-value')

  private typeValue = (): PageElement => cy.get('.type-value')
}
