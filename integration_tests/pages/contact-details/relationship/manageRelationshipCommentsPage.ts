import Page, { PageElement } from '../../page'

export default class ManageRelationshipCommentsPage extends Page {
  constructor(contactName: string, prisonerName: string, isOptional: boolean = false) {
    let title
    if (isOptional) {
      title = `Add comments on the relationship between ${contactName} and ${prisonerName} (optional)`
    } else {
      title = `Change the comments on the relationship between ${contactName} and ${prisonerName}`
    }
    super(title)
  }

  enterComments(value: string): ManageRelationshipCommentsPage {
    this.commentsTextBox().clear().type(value, { delay: 0 })
    return this
  }

  private commentsTextBox = (): PageElement => cy.get('#comments')
}
