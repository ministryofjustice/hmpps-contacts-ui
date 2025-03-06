import Page, { PageElement } from '../../page'

export default class EnterAddressCommentsPage extends Page {
  constructor() {
    super(`Add any comments about this address (optional)`)
  }

  hasComments(value: string) {
    this.commentsTextbox().should('have.value', value)
    return this
  }

  enterComments(value: string) {
    this.clearComments()
    this.commentsTextbox().type(value, { delay: 0 })
    return this
  }

  clearComments() {
    this.commentsTextbox().clear()
    return this
  }

  private commentsTextbox = (): PageElement => cy.findByRole('textbox', { name: 'Comments about this address' })
}
