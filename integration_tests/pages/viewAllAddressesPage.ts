import Page, { PageElement } from './page'

export default class ViewAllAddressesPage extends Page {
  constructor(name: string) {
    super(`Addresses for ${name}`)
  }

  clickAddAddressButton() {
    this.addAddressButton().click()
  }

  clickChangeAddressLink(contactAddressId: number) {
    this.changeAddressLink(contactAddressId).first().click()
  }

  clickAddAddressPhoneLink(contactAddressId: number) {
    this.addAddressPhoneLink(contactAddressId).click()
  }

  clickEditAddressPhoneLink(contactAddressId: number, contactPhoneId: number) {
    this.editAddressPhoneLink(contactAddressId, contactPhoneId).click()
  }

  clickDeleteAddressPhoneLink(contactAddressId: number, contactPhoneId: number) {
    this.deleteAddressPhoneLink(contactAddressId, contactPhoneId).click()
  }

  private addAddressButton = (): PageElement => cy.get('[data-qa=add-address-button]')

  private changeAddressLink = (contactAddressId: number): PageElement =>
    cy.get(`[data-qa=change-address-${contactAddressId}]`)

  private addAddressPhoneLink = (contactAddressId: number): PageElement =>
    cy.get(`[data-qa=add-address-phone-${contactAddressId}]`)

  private editAddressPhoneLink = (contactAddressId: number, contactPhoneId: number): PageElement =>
    cy.get(`[data-qa=change-address-specific-${contactAddressId}-phone-${contactPhoneId}]`)

  private deleteAddressPhoneLink = (contactAddressId: number, contactPhoneId: number): PageElement =>
    cy.get(`[data-qa=delete-address-specific-${contactAddressId}-phone-${contactPhoneId}]`)
}
