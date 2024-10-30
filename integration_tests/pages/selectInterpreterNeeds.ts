import Page, { PageElement } from './page'

export default class SelectInterpreterNeedsPage extends Page {
  constructor(name: string) {
    super(`Does ${name} need an interpreter?`)
  }

  selectIsInterpreterNeeded(value: 'YES' | 'NO'): SelectInterpreterNeedsPage {
    this.radio(value).click()
    return this
  }

  clickCancel(): SelectInterpreterNeedsPage {
    this.cancelButton().click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}
