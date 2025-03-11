import Page, { PageElement } from './page'

export default class AddEmailsPage extends Page {
  constructor(name: string) {
    super(`Add email addresses for ${name}`)
  }

  enterEmail(index: number, value: string | ''): AddEmailsPage {
    this.emailTextBox(index).clear().type(value, { delay: 0 })
    return this
  }

  clickAddAnotherButton(): AddEmailsPage {
    cy.findByRole('button', { name: 'Add another email address' }).click()
    return this
  }

  clickRemoveButton(index: number): AddEmailsPage {
    cy.findAllByRole('button', { name: 'Remove' }).eq(index).click()
    return this
  }

  private emailTextBox = (index: number): PageElement =>
    cy.findAllByRole('textbox', { name: 'Email address' }).eq(index)
}
