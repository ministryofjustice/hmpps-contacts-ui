import Page, { PageElement } from './page'

export default class SelectRelationshipPage extends Page {
  constructor(name: string) {
    super(`How is ${name} related to the prisoner?`)
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
