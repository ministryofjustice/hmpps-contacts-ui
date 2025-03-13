import Page, { PageElement } from '../../page'

export default class RelationshipCommentsPage extends Page {
  constructor(contactName: string, prisonerName: string, isOptional: boolean = false) {
    let title
    if (isOptional) {
      title = `Add comments on the relationship between ${contactName} and ${prisonerName} (optional)`
    } else {
      title = `Change the comments on the relationship between ${contactName} and ${prisonerName}`
    }
    super(title)
  }

  verifyComments(value: string): RelationshipCommentsPage {
    this.commentsTextBox().should('have.value', value)
    return this
  }

  clearComments(): RelationshipCommentsPage {
    this.commentsTextBox().clear()
    return this
  }

  enterComments(value: string): RelationshipCommentsPage {
    this.commentsTextBox().clear().type(value, { delay: 0 })
    return this
  }

  private commentsTextBox = (): PageElement => cy.get('#comments')
}
