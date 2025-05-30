import Page, { PageElement } from './page'

export default class DeleteRelationshipPage extends Page {
  constructor(allowedToDelete: boolean, prisonerName: string, contactName: string) {
    super(
      allowedToDelete
        ? `Are you sure you want to delete this relationship between ${contactName} and the prisoner ${prisonerName}?`
        : 'You cannot delete the record of this relationship as it includes information about relationship restrictions',
    )
  }

  selectBlockedAction(value: 'GO_TO_CONTACT_LIST' | 'GO_TO_CONTACT_RECORD'): DeleteRelationshipPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'GO_TO_CONTACT_LIST' | 'GO_TO_CONTACT_RECORD'): PageElement =>
    cy.get(`.govuk-radios__input[value='${value}']`)
}
