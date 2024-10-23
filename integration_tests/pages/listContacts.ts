import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor() {
    super('Contacts')
  }

  clickAddNewContactButton() {
    this.addNewContactButton().click()
  }

  clickActiveSectionTabButton(): ListContactsPage {
    this.activeSectionTab().click()
    return this
  }

  clickInactiveSectionTabButton(): ListContactsPage {
    this.inactiveSectionTab().click()
    return this
  }

  clickContactNamesLink(contactId: number): ListContactsPage {
    this.contactNames(contactId).click()
    return this
  }

  verifyShowPaginationNavigationValueAs(expected: string): ListContactsPage {
    this.paginationNavigationLink().should('contain.text', expected)
    return this
  }

  verifyShowPaginationPageLinkValueAs(expected: string, index: number): ListContactsPage {
    this.paginationPageLink(index).should('contain.text', expected)
    return this
  }

  verifyShowPaginationActivePageValueAs(expected: string): ListContactsPage {
    this.paginationPageLinkActive().should('contain.text', expected)
    return this
  }

  verifyShowPaginationPageValueAs(expected: string): ListContactsPage {
    this.paginationWithDots().should('contain.text', expected)
    return this
  }

  private addNewContactButton = (): PageElement => cy.get('[data-qa=add-contact-button]')

  private paginationNavigationLink = (): PageElement => cy.get(`.moj-pagination__link`)

  private paginationPageLink = (index: number): PageElement => cy.get(`.moj-pagination__link:eq(${index})`)

  private paginationPageLinkActive = (): PageElement => cy.get(`.moj-pagination__item--active`)

  private paginationWithDots = (): PageElement => cy.get(`.moj-pagination__item--dots`)

  private activeSectionTab = (): PageElement => cy.get(`[data-qa=active-list]`)

  private inactiveSectionTab = (): PageElement => cy.get(`[data-qa=inactive-list]`)

  private contactNames = (contactId: number): PageElement =>
    cy.get(`#active-contacts [data-qa="contact-${contactId}-link"]`)
}
