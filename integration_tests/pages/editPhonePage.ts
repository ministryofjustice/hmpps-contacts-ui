import Page, { PageElement } from './page'

export default class EditPhonePage extends Page {
  constructor(name: string) {
    super(`Update a phone number for ${name}`)
  }

  hasPhoneNumber(value: string): EditPhonePage {
    this.phoneNumberTextBox().should('have.value', value)
    return this
  }

  enterPhoneNumber(value: string): EditPhonePage {
    this.phoneNumberTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearPhoneNumber(): EditPhonePage {
    this.phoneNumberTextBox().clear()
    return this
  }

  selectType(value: string): EditPhonePage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): EditPhonePage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterExtension(value: string): EditPhonePage {
    this.extensionTextBox().clear().type(value, { delay: 0 })
    return this
  }

  hasExtension(value: string): EditPhonePage {
    this.extensionTextBox().should('have.value', value)
    return this
  }

  clearExtension(): EditPhonePage {
    this.extensionTextBox().clear()
    return this
  }

  private phoneNumberTextBox = (): PageElement => cy.get('#phoneNumber')

  private extensionTextBox = (): PageElement => cy.get('#extension')

  private typeSelect = (): PageElement => cy.get('#type')
}
