import { PageElement } from './page'
import ContinuablePage from './continuablePage'

export default class RelationshipCommentsPage extends ContinuablePage {
  constructor(name: string) {
    super(`Add additional information about the relationship between the prisoner and ${name}`)
  }

  enterComments(value: string): RelationshipCommentsPage {
    this.commentsTextBox().clear().type(value)
    return this
  }

  private commentsTextBox = (): PageElement => cy.get('#comments')
}
