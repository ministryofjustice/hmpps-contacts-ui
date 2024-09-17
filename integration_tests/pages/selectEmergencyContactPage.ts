import Page, { PageElement } from './page'

export default class SelectEmergencyContactPage extends Page {
  constructor(name: string) {
    super(`Is ${name} an emergency contact for the prisoner?`)
  }

  selectIsEmergencyContact(value: 'YES' | 'NO'): SelectEmergencyContactPage {
    this.radio(value).click()
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
