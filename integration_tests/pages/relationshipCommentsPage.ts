import Page, { PageElement } from './page'

export default class RelationshipCommentsPage extends Page {
  constructor(name: string) {
    super(`Add additional information about the relationship between the prisoner and ${name}`)
  }

  enterComments(value: string): RelationshipCommentsPage {
    this.commentsTextBox().clear().type(value, { delay: 0 })
    return this
  }

  private commentsTextBox = (): PageElement => cy.get('#comments')
}
