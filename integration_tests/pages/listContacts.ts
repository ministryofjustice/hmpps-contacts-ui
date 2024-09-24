import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor() {
    super('Contacts')
  }

  clickAddNewContactButton() {
    this.addNewContactButton().click()
  }

  private addNewContactButton = (): PageElement => cy.get('[data-qa=add-contact-button]')
}
