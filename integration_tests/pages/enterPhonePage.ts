import Page, { PageElement } from './page'

export default class EnterPhonePage extends Page {
  constructor(name: string) {
    super(`What is the phone number for ${name}?`)
  }

  enterPhoneNumber(value: string): EnterPhonePage {
    this.phoneNumberTextBox().clear().type(value)
    return this
  }

  selectType(value: string): EnterPhonePage {
    this.typeSelect().select(value)
    return this
  }

  enterExtension(value: string): EnterPhonePage {
    this.extensionTextBox().clear().type(value)
    return this
  }

  private phoneNumberTextBox = (): PageElement => cy.get('#phoneNumber')

  private extensionTextBox = (): PageElement => cy.get('#extension')

  private typeSelect = (): PageElement => cy.get('#type')
}
