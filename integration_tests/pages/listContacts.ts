import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor() {
    super('Contacts')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  manageContactsCard = (): PageElement => cy.get('[data-qa=manage-contacts-card]')

  manageContactRestrictionsCard = (): PageElement => cy.get('[data-qa=manage-restrictions-card]')
}
