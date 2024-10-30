import Page, { PageElement } from './page'

export default class EnterPhonePage extends Page {
  constructor(name: string) {
    super(`What is the phone number for ${name}?`)
  }

  hasPhoneNumber(value: string): EnterPhonePage {
    this.phoneNumberTextBox().should('have.value', value)
    return this
  }

  enterPhoneNumber(value: string): EnterPhonePage {
    this.phoneNumberTextBox().clear().type(value)
    return this
  }

  clearPhoneNumber(): EnterPhonePage {
    this.phoneNumberTextBox().clear()
    return this
  }

  selectType(value: string): EnterPhonePage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): EnterPhonePage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterExtension(value: string): EnterPhonePage {
    this.extensionTextBox().clear().type(value)
    return this
  }

  hasExtension(value: string): EnterPhonePage {
    this.extensionTextBox().should('have.value', value)
    return this
  }

  clearExtension(): EnterPhonePage {
    this.extensionTextBox().clear()
    return this
  }

  private phoneNumberTextBox = (): PageElement => cy.get('#phoneNumber')

  private extensionTextBox = (): PageElement => cy.get('#extension')

  private typeSelect = (): PageElement => cy.get('#type')
}
