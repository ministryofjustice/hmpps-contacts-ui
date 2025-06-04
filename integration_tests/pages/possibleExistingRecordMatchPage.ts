import Page, { PageElement } from './page'

export default class PossibleExistingRecordMatchPage extends Page {
  constructor(contactName: string, prisonerName: string) {
    super(`Check and confirm if you want to link contact ${contactName} to prisoner ${prisonerName}`)
  }

  selectRadio(
    value: 'YES' | 'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS' | 'NO_CONTINUE_ADDING_CONTACT',
  ): PossibleExistingRecordMatchPage {
    this.radio(value).click()
    return this
  }

  private radio = (
    value: 'YES' | 'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS' | 'NO_CONTINUE_ADDING_CONTACT',
  ): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
