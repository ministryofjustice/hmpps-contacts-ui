import Page, { PageElement } from './page'

export default class EnterEmailPage extends Page {
  constructor(name: string) {
    super(`What is the email address for ${name}?`)
  }

  hasEmail(email: string): EnterEmailPage {
    this.emailTextBox().should('have.value', email)
    return this
  }

  enterEmail(value: string | ''): EnterEmailPage {
    this.emailTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearEmail(): EnterEmailPage {
    this.emailTextBox().clear()
    return this
  }

  private emailTextBox = (): PageElement => cy.get('#emailAddress')
}
