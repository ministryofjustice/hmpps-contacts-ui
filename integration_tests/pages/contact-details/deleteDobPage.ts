import Page, { PageElement } from '../page'

export default class DeleteDobPage extends Page {
  constructor(contactName: string) {
    super(`Are you sure you want to delete the date of birth for ${contactName}?`)
  }

  hasDateOfDeath(value: string): DeleteDobPage {
    this.dateOfDeathValue().should('contain.text', value)
    return this
  }

  private dateOfDeathValue = (): PageElement => cy.get('.date-of-birth-value')
}
