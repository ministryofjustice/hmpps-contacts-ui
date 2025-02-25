import Page, { PageElement } from '../page'

export default class DeleteDateOfDeathPage extends Page {
  constructor(contactName: string) {
    super(`Are you sure you want to delete the date of death for ${contactName}?`)
  }

  hasDateOfDeath(value: string): DeleteDateOfDeathPage {
    this.dateOfDeathValue().should('contain.text', value)
    return this
  }

  private dateOfDeathValue = (): PageElement => cy.get('.date-of-death-value')
}
