import Page, { PageElement } from './page'

export default class HandleDuplicateRelationshipPage extends Page {
  constructor(isNewRelationship: boolean) {
    super(
      isNewRelationship
        ? 'This relationship has already been recorded'
        : 'You cannot make this change as the relationship has already been recorded',
    )
  }

  selectAction(value: 'GO_TO_CONTACT_LIST' | 'GO_TO_DUPE'): HandleDuplicateRelationshipPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'GO_TO_CONTACT_LIST' | 'GO_TO_DUPE'): PageElement =>
    cy.get(`.govuk-radios__input[value='${value}']`)
}
