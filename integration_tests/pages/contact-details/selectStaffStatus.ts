import Page, { PageElement } from '../page'

export default class SelectStaffStatusPage extends Page {
  constructor(name: string, optional: boolean) {
    super(`Is ${name} a member of staff?${optional ? ' (optional)' : ''}`)
  }

  selectStaffStatus(value: 'YES' | 'NO'): SelectStaffStatusPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
