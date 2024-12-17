import Page, { PageElement } from './page'

export default class EnterAddressPhonePage extends Page {
  constructor() {
    super(`What is the phone number for this address?`)
  }

  hasPhoneNumber(value: string): EnterAddressPhonePage {
    this.phoneNumberTextBox().should('have.value', value)
    return this
  }

  enterPhoneNumber(value: string): EnterAddressPhonePage {
    this.phoneNumberTextBox().clear().type(value)
    return this
  }

  clearPhoneNumber(): EnterAddressPhonePage {
    this.phoneNumberTextBox().clear()
    return this
  }

  selectType(value: string): EnterAddressPhonePage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): EnterAddressPhonePage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterExtension(value: string): EnterAddressPhonePage {
    this.extensionTextBox().clear().type(value)
    return this
  }

  hasExtension(value: string): EnterAddressPhonePage {
    this.extensionTextBox().should('have.value', value)
    return this
  }

  clearExtension(): EnterAddressPhonePage {
    this.extensionTextBox().clear()
    return this
  }

  private phoneNumberTextBox = (): PageElement => cy.get('#phoneNumber')

  private extensionTextBox = (): PageElement => cy.get('#extension')

  private typeSelect = (): PageElement => cy.get('#type')
}
