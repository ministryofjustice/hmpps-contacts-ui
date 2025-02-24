import Page, { PageElement } from './page'

export default class SelectRelationshipTypePage extends Page {
  constructor(contactName: string, prisonerName: string) {
    super(`Is ${contactName} a social or official contact for ${prisonerName}?`)
  }

  selectRelationshipType(value: 'S' | 'O'): SelectRelationshipTypePage {
    this.radio(value).click()
    return this
  }

  hasRelationshipType(value: 'S' | 'O'): SelectRelationshipTypePage {
    this.radio(value).should('be.checked')
    return this
  }

  private radio = (value: 'S' | 'O'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
