import Page, { PageElement } from './page'

export default class CreateContactSuccessPage extends Page {
  constructor() {
    super('New contact added and linked to prisoner')
  }

  clickContactInfoLink() {
    this.viewContactInfoLink().click()
  }

  clickContactListLink() {
    this.viewContactListLink().click()
  }

  private viewContactInfoLink = (): PageElement => cy.get(`[data-qa=go-to-contact-info-link]`)

  private viewContactListLink = (): PageElement => cy.get(`[data-qa=go-to-contacts-list-link]`)
}
