import Page, { PageElement } from './page'

export default class SelectGenderPage extends Page {
  constructor(name: string) {
    super(`What is ${name}’s gender? (optional)`)
  }

  selectGender(value: 'M' | 'F' | 'NK' | 'NF'): SelectGenderPage {
    this.radio(value).click()
    return this
  }

  clickSaveAndCancel(): SelectGenderPage {
    this.cancelButton().click()
    return this
  }

  private radio = (value: 'M' | 'F' | 'NK' | 'NF'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}
