import Page, { PageElement } from './page'

export default class CreateContactCheckYourAnswersPage extends Page {
  constructor() {
    super(`Check your answers`)
  }

  clickCreatePrisonerContact() {
    this.createPrisonerContactButton().click()
  }

  clickChangeNameLink() {
    this.changeNameLink().click()
  }

  clickChangeDateOfBirthLink() {
    this.changeDateOfBirthLink().click()
  }

  clickChangeEstimatedDateOfBirthLink() {
    this.changeEstimatedDateOfBirthLink().click()
  }

  clickChangeRelationshipLink() {
    this.changeRelationshipLink().click()
  }

  clickChangeEmergencyContactLink() {
    this.changeEmergencyContactLink().click()
  }

  clickChangeNextOfKinLink() {
    this.changeNextOfKinLink().click()
  }

  verifyShowsNameAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersNameValue().should('contain.text', expected)
    return this
  }

  verifyShowsDateOfBirthAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersDobValue().should('contain.text', expected)
    return this
  }

  verifyShowsEstimatedDateOfBirthAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersEstimatedDobValue().should('contain.text', expected)
    return this
  }

  verifyShowRelationshipAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersRelationshipValue().should('contain.text', expected)
    return this
  }

  verifyShowIsEmergencyContactAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersEmergencyContactValue().should('contain.text', expected)
    return this
  }

  verifyShowIsNextOfKinAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersNextOfKinValue().should('contain.text', expected)
    return this
  }

  private createPrisonerContactButton = (): PageElement => cy.get('[data-qa=create-prisoner-contact-button]')

  private checkAnswersNameValue = (): PageElement => cy.get('.check-answers-name-value')

  private checkAnswersDobValue = (): PageElement => cy.get('.check-answers-dob-value')

  private checkAnswersEstimatedDobValue = (): PageElement => cy.get('.check-answers-estimated-dob-value')

  private checkAnswersRelationshipValue = (): PageElement => cy.get('.check-answers-relationship-value')

  private checkAnswersEmergencyContactValue = (): PageElement => cy.get('.check-answers-emergency-contact-value')

  private checkAnswersNextOfKinValue = (): PageElement => cy.get('.check-answers-next-of-kin-value')

  private changeNameLink = (): PageElement => cy.get('[data-qa=change-name-link]')

  private changeDateOfBirthLink = (): PageElement => cy.get('[data-qa=change-dob-link]')

  private changeEstimatedDateOfBirthLink = (): PageElement => cy.get('[data-qa=change-estimated-dob-link]')

  private changeRelationshipLink = (): PageElement => cy.get('[data-qa=change-relationship-link]')

  private changeEmergencyContactLink = (): PageElement => cy.get('[data-qa=change-emergency-contact-link]')

  private changeNextOfKinLink = (): PageElement => cy.get('[data-qa=change-next-of-kin-link]')
}
