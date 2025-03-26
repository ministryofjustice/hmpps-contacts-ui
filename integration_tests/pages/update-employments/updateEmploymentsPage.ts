import Page from '../page'

export default class UpdateEmploymentsPage extends Page {
  constructor(isNewContact: boolean = false) {
    super(isNewContact ? 'Record employment information' : 'Edit employment information')
  }

  toHaveNumberOfEmployments(count: number) {
    cy.get('dt:contains("Employer name")').should('have.length', count)
  }

  employerName(idx: number) {
    return cy.get('dt:contains("Employer name")').eq(idx).next()
  }

  employerAddress(idx: number) {
    return cy.get('dt:contains("Employer’s primary address")').eq(idx).next()
  }

  employerPhone(idx: number) {
    return cy.get('dt:contains("Business phone number at primary address")').eq(idx).next()
  }

  employmentStatus(idx: number) {
    return cy.get('dt:contains("Employment status")').eq(idx).next()
  }

  clickDeleteEmployer(employerName: string, active: boolean) {
    cy.findByRole('link', {
      name: `Delete employer (${active ? 'Active employer' : 'Past employer'}: ${employerName})`,
    }).click()
  }

  clickChangeEmployer(employerName: string, active: boolean) {
    cy.findByRole('link', {
      name: `Change organisation (${active ? 'Active employer' : 'Past employer'}: ${employerName})`,
    }).click()
  }

  clickChangeStatus(employerName: string, active: boolean) {
    cy.findByRole('link', {
      name: `Change status of the employment with (${active ? 'Active employer' : 'Past employer'}: ${employerName})`,
    }).click()
  }

  clickAddEmployer() {
    cy.findByRole('button', { name: /Add (another )?employer/ }).click()
  }

  clickConfirmAndSave() {
    cy.findByRole('button', { name: 'Confirm and save' }).click()
  }
}
