import Page, { PageElement } from './page'

export default class ConfirmDeleteEmailPage extends Page {
  constructor(name: string) {
    super(`Are you sure you want to delete this email address for ${name}?`)
  }

  hasEmailAddress(value: string): ConfirmDeleteEmailPage {
    this.emailValue().should('contain.text', value)
    return this
  }

  private emailValue = (): PageElement => cy.get('.email-value')
}
