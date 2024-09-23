import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor() {
    super('Contacts')
  }

  clickAddNewContactButton() {
    this.addNewContactButton().click()
  }

  clickCreateNewContactButton() {
    this.createNewContactButton().click()
  }

  private createNewContactButton = (): PageElement => cy.get('[data-qa=create-new-contact-button]')

  private addNewContactButton = (): PageElement => cy.get('[data-qa=add-contact-button]')
}
