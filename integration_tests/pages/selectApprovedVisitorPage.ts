import Page, { PageElement } from './page'

export default class SelectApprovedVisitorPage extends Page {
  constructor(name: string) {
    super(`Is ${name} approved to visit the prisoner?`)
  }

  selectIsApprovedVisitor(value: 'YES' | 'NO'): SelectApprovedVisitorPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
