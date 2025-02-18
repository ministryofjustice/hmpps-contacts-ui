import Page from '../page'

export default class DeleteEmploymentPage extends Page {
  constructor() {
    super('Are you sure you want to delete this employer')
  }

  employerName() {
    return cy.get('dt:contains("Employer name")').next()
  }

  employerAddress() {
    return cy.get('dt:contains("Employer’s primary address")').next()
  }

  employerPhone() {
    return cy.get('dt:contains("Business phone number at primary address")').next()
  }

  employmentStatus() {
    return cy.get('dt:contains("Employment status")').next()
  }

  clickConfirm() {
    cy.findByRole('button', { name: 'Yes, delete' }).click()
  }

  clickCancel() {
    cy.findByRole('button', { name: 'No, do not delete' }).click()
  }
}
