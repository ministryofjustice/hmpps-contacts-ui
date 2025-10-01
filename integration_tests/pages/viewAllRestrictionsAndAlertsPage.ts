import Page, { PageElement } from './page'

export default class ViewAllRestrictionsAndAlertsPage extends Page {
  constructor() {
    super('Test Prisoner’s prisoner')
  }

  checkPrisonerContactRestrictionsCardTitle() {
    this.getPrisonerRestrictionsCardTitle().should('contain.text', `prisoner restrictions`)
    return this
  }

  checkPrisonerAlertsCardTitle() {
    this.getPrisonerAlertsCardTitle().should('contain.text', `prisoner alerts`)
    return this
  }

  private getPrisonerRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="prisoner-restrictions-heading"]')

  private getPrisonerAlertsCardTitle = (): PageElement => cy.get('[data-qa="prisoner-alerts-heading"]')
}
