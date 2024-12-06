import Page, { PageElement } from './page'

export default class ViewAllAddressesPage extends Page {
  constructor(name: string) {
    super(`Addresses for ${name}`)
  }

  clickAddAddressButton() {
    this.addAddressButton().click()
  }

  private addAddressButton = (): PageElement => cy.get('[data-qa=add-address-button]')
}
