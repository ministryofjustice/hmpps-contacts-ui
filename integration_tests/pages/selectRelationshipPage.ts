import Page, { PageElement } from './page'

export default class SelectRelationshipPage extends Page {
  constructor(contactName: string, prisonerName: string) {
    super(`What is ${contactName}’s relationship to ${prisonerName}?`)
  }

  hasRelationshipSelected(value: string): SelectRelationshipPage {
    this.relationshipSelect().should('have.value', value)
    return this
  }

  selectRelationship(value: string): SelectRelationshipPage {
    this.relationshipSelect().select(value)
    return this
  }

  private relationshipSelect = (): PageElement => cy.get('#relationship')
}
