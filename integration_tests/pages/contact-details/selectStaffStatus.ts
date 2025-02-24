import Page, { PageElement } from '../page'

export default class SelectStaffStatusPage extends Page {
  constructor(name: string) {
    super(`Is ${name} a member of staff?`)
  }

  selectStaffStatus(): SelectStaffStatusPage {
    this.radio().click()
    return this
  }

  private radio = (): PageElement => cy.get('#isStaff')
}
