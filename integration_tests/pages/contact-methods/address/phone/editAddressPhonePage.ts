import Page, { PageElement } from '../../../page'

export default class EditAddressPhonePage extends Page {
  constructor() {
    super('Update a phone number for this address')
  }

  hasPhoneNumber(value: string): EditAddressPhonePage {
    this.phoneNumberTextBox().should('have.value', value)
    return this
  }

  enterPhoneNumber(value: string): EditAddressPhonePage {
    this.phoneNumberTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearPhoneNumber(): EditAddressPhonePage {
    this.phoneNumberTextBox().clear()
    return this
  }

  selectType(value: string): EditAddressPhonePage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): EditAddressPhonePage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterExtension(value: string): EditAddressPhonePage {
    this.extensionTextBox().clear().type(value, { delay: 0 })
    return this
  }

  hasExtension(value: string): EditAddressPhonePage {
    this.extensionTextBox().should('have.value', value)
    return this
  }

  clearExtension(): EditAddressPhonePage {
    this.extensionTextBox().clear()
    return this
  }

  private phoneNumberTextBox = (): PageElement => cy.findByRole('textbox', { name: 'Phone number' })

  private extensionTextBox = (): PageElement => cy.findByRole('textbox', { name: 'Extension (optional)' })

  private typeSelect = (): PageElement => cy.findByRole('combobox', { name: 'Phone number type' })
}
