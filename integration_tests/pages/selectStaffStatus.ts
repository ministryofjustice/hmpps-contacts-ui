import Page, { PageElement } from './page'

export default class SelectStaffStatusPage extends Page {
  constructor(name: string) {
    super(`Is ${name} a member of staff?`)
  }

  clickCancel(): SelectStaffStatusPage {
    this.cancelButton().click()
    return this
  }

  selectStaffStatus(): SelectStaffStatusPage {
    this.radio().click()
    return this
  }

  private radio = (): PageElement => cy.get('#isStaff')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}
