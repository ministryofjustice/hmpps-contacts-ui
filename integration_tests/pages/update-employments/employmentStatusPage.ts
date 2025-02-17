import Page from '../page'

export default class EmploymentStatusPage extends Page {
  constructor() {
    super('What is the current employment status')
  }

  activeRadio() {
    return cy.findByRole('radio', { name: 'Active' })
  }

  inactiveRadio() {
    return cy.findByRole('radio', { name: 'Inactive' })
  }

  clickContinue() {
    cy.findByRole('button', { name: 'Continue' }).click()
  }
}
