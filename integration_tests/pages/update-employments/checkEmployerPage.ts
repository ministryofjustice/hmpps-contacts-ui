import Page from '../page'

export default class CheckEmployerPage extends Page {
  constructor() {
    super('Check and confirm if this is the correct employer')
  }

  employerName() {
    return cy.get('dt:contains("Organisation name")').next()
  }

  yesRadio() {
    return cy.findByRole('radio', { name: 'Yes' })
  }

  clickContinue() {
    cy.findByRole('button', { name: 'Continue' }).click()
  }
}
