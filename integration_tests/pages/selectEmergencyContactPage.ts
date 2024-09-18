import { PageElement } from './page'
import ContinuablePage from './continuablePage'

export default class SelectEmergencyContactPage extends ContinuablePage {
  constructor(name: string) {
    super(`Is ${name} an emergency contact for the prisoner?`)
  }

  selectIsEmergencyContact(value: 'YES' | 'NO'): SelectEmergencyContactPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
