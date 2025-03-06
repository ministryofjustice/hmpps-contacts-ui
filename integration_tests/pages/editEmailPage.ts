import Page, { PageElement } from './page'

export default class EditEmailPage extends Page {
  constructor(name: string) {
    super(`Update an email address for ${name}`)
  }

  hasEmail(email: string): EditEmailPage {
    this.emailTextBox().should('have.value', email)
    return this
  }

  enterEmail(value: string | ''): EditEmailPage {
    this.emailTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearEmail(): EditEmailPage {
    this.emailTextBox().clear()
    return this
  }

  private emailTextBox = (): PageElement => cy.get('#emailAddress')
}
