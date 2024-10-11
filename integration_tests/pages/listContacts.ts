import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor() {
    super('Contacts')
  }

  clickAddNewContactButton() {
    this.addNewContactButton().click()
  }

  verifyShowPaginationNavigationValueAs(expected: string, name: string): ListContactsPage {
    this.paginationNavigationLink(name).should('contain.text', expected)
    return this
  }

  verifyShowPaginationPageLinkValueAs(expected: string, index: number): ListContactsPage {
    this.paginationPageLink(index).should('contain.text', expected)
    return this
  }

  private addNewContactButton = (): PageElement => cy.get('[data-qa=add-contact-button]')

  private paginationNavigationLink = (name: string): PageElement => cy.get(`[data-qa=pagination-${name}-link]`)

  private paginationPageLink = (index: number): PageElement => cy.get(`[data-qa=page-${index}-link]`)
}
