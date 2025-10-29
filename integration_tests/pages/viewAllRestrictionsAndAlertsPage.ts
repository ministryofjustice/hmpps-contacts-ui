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
    this.getPrisonerAlertsCardTitle().should('contain.text', `Prisoner’s alerts`)
    return this
  }

  getPrisonerAlertFlagLabel() {
    this.getPrisonerAlertFlagLabelValue().should('contain.text', `Accredited Programme hold`)
    return this
  }

  private getPrisonerAlertFlagLabelValue = (): PageElement => cy.get('[data-qa="prisoner-alerts-1-type-value"]')

  private getPrisonerRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="prisoner-restrictions-heading"]')

  private getPrisonerAlertsCardTitle = (): PageElement => cy.get('[data-qa="prisoner-alerts-heading"]')
}
