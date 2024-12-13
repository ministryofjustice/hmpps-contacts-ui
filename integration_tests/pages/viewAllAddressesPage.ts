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

  private addAddressButton = (): PageElement => cy.get('[data-qa=add-address-button]')

  private changeAddressLink = (contactAddressId: number): PageElement =>
    cy.get(`[data-qa=change-address-${contactAddressId}]`)
}
