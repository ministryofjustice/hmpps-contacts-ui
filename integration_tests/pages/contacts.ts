import Page, { PageElement } from './page'

export default class ContactsPage extends Page {
  constructor() {
    super('Contacts')
  }

  enterSearchTerm(value: string): ContactsPage {
    this.searchTermTextBox().type(value)
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  manageContactsCard = (): PageElement => cy.get('[data-qa=manage-contacts-card]')

  manageContactRestrictionsCard = (): PageElement => cy.get('[data-qa=manage-restrictions-card]')

  private searchTermTextBox = (): PageElement => cy.get('#search')

  private continueButton = (): PageElement => cy.get('[data-test="search"]')
}
