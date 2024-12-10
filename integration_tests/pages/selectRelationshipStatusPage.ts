import Page, { PageElement } from './page'

export default class SelectRelationshipStatusPage extends Page {
  constructor(name: string) {
    super(`Is the relationship between ${name} and the prisoner active?`)
  }

  selectIsRelationshipActive(value: 'YES' | 'NO'): SelectRelationshipStatusPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
