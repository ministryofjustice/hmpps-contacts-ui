import Page, { PageElement } from './page'

export default class CreateRestrictionSuccessPage extends Page {
  constructor(restrictionClass: 'CONTACT_GLOBAL' | 'PRISONER_CONTACT') {
    super(
      restrictionClass === 'CONTACT_GLOBAL'
        ? 'New global restriction recorded'
        : `New relationship restriction recorded`,
    )
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
