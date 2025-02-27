import Page, { PageElement } from '../../page'

export default class SelectRelationshipStatusPage extends Page {
  constructor(contactName: string, prisonerName: string) {
    super(`What is the status of the relationship between ${contactName} and ${prisonerName}?`)
  }

  selectIsRelationshipActive(value: 'YES' | 'NO'): SelectRelationshipStatusPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
