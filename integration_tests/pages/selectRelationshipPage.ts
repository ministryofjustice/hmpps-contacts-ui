import { PageElement } from './page'
import ContinuablePage from './continuablePage'

export default class SelectRelationshipPage extends ContinuablePage {
  constructor(name: string) {
    super(`How is ${name} related to the prisoner?`)
  }

  selectRelationship(value: string): SelectRelationshipPage {
    this.relationshipSelect().select(value)
    return this
  }

  hasSelectedRelationshipHint(value: string): SelectRelationshipPage {
    this.selectedRelationshipHint().should('contain.text', value)
    return this
  }

  private relationshipSelect = (): PageElement => cy.get('#relationship')

  private selectedRelationshipHint = (): PageElement => cy.get('#selected-relationship-hint')
}
