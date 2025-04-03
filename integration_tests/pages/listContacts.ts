import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor(prisonerName: string) {
    super(`View and manage contacts linked to ${prisonerName}`)
  }

  clickAddNewContactButton() {
    this.clickButton('Link another contact')
  }

  clickContactNamesLink(name: string): ListContactsPage {
    this.clickLink(name)
    return this
  }

  private addNewContactButton = (): PageElement => cy.get('[data-qa=add-contact-button]')

  private contactNames = (contactId: number): PageElement =>
    cy.get(`#active-contacts [data-qa="contact-${contactId}-link"]`)
}
