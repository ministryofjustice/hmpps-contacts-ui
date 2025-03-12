import Page from '../../../page'

export default class AddAddressPhonesPage extends Page {
  constructor() {
    super('Add phone numbers for this address')
  }

  hasPhoneNumber(index: number, value: string) {
    this.phoneNumberTextBox(index).should('have.value', value)
    return this
  }

  enterPhoneNumber(index: number, value: string) {
    this.phoneNumberTextBox(index).clear().type(value, { delay: 0 })
    return this
  }

  clearPhoneNumber(index: number) {
    this.phoneNumberTextBox(index).clear()
    return this
  }

  selectType(index: number, value: string) {
    this.typeSelect(index).select(value)
    return this
  }

  hasType(index: number, value: string) {
    this.typeSelect(index).should('have.value', value)
    return this
  }

  enterExtension(index: number, value: string) {
    this.extensionTextBox(index).clear().type(value, { delay: 0 })
    return this
  }

  hasExtension(index: number, value: string) {
    this.extensionTextBox(index).should('have.value', value)
    return this
  }

  clearExtension(index: number) {
    this.extensionTextBox(index).clear()
    return this
  }

  clickAddAnotherButton() {
    cy.findByRole('button', { name: 'Add another phone number' }).click()
    return this
  }

  clickRemoveButton(index: number) {
    cy.findAllByRole('button', { name: 'Remove' }).eq(index).click()
    return this
  }

  private phoneNumberTextBox = (index: number) => cy.findAllByRole('textbox', { name: 'Phone number' }).eq(index)

  private extensionTextBox = (index: number) => cy.findAllByRole('textbox', { name: 'Extension (optional)' }).eq(index)

  private typeSelect = (index: number) => cy.findAllByRole('combobox', { name: 'Phone number type' }).eq(index)
}
