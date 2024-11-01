import Page, { PageElement } from './page'

export default class SelectDomesticStatusPage extends Page {
  constructor(name: string) {
    super(`What is the domestic status of ${name}?`)
  }

  selectDomesticStatus(value: string): SelectDomesticStatusPage {
    this.domesticStatus().select(value)
    return this
  }

  clickSaveAndCancel(): SelectDomesticStatusPage {
    this.cancelButton().click()
    return this
  }

  private domesticStatus = (): PageElement => cy.get('#domesticStatusCode')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}
