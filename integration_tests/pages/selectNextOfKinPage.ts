import { PageElement } from './page'
import ContinuablePage from './continuablePage'

export default class SelectNextOfKinPage extends ContinuablePage {
  constructor(name: string) {
    super(`Is ${name} next of kin for the prisoner?`)
  }

  selectIsNextOfKin(value: 'YES' | 'NO'): SelectNextOfKinPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
