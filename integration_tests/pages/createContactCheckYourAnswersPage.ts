import Page, { PageElement } from './page'

export default class CreateContactCheckYourAnswersPage extends Page {
  constructor(prisonerName: string) {
    super(`Check your answers before linking the contact to ${prisonerName}`)
  }

  clickChangeDateOfBirthLink() {
    this.changeDateOfBirthLink().click()
  }

  clickChangeRelationshipTypeLink() {
    this.changeRelationshipTypeLink().click()
  }

  clickChangeRelationshipLink() {
    this.changeRelationshipLink().click()
  }

  clickChangeEmergencyContactLink() {
    this.changeEmergencyContactLink().click()
  }

  clickChangeCommentsLink() {
    this.changeCommentsLink().click()
  }

  clickChangeEmailLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: 'Change this email address' }).eq(index).click()
    return new constructor(...args)
  }

  clickDeleteEmailLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: 'Delete this email address' }).eq(index).click()
    return new constructor(...args)
  }

  verifyShowsTitleAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersTitleValue().should('contain.text', expected)
    return this
  }

  verifyShowsNameAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersNameValue().should('contain.text', expected)
    return this
  }

  verifyShowsDateOfBirthAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersDobValue().should('contain.text', expected)
    return this
  }

  verifyShowRelationshipTypeAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersRelationshipTypeValue().should('contain.text', expected)
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

  verifyShowCommentsAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersCommentsValue().should('contain.text', expected)
    return this
  }

  verifyShowGenderAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersGenderValue().should('contain.text', expected)
    return this
  }

  verifyShowDomesticStatusAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersDomesticStatusValue().should('contain.text', expected)
    return this
  }

  verifyShowIsStaffAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersStaffValue().should('contain.text', expected)
    return this
  }

  verifyShowLanguageAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersLanguageValue().should('contain.text', expected)
    return this
  }

  verifyShowInterpreterRequiredAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersInterpreterValue().should('contain.text', expected)
    return this
  }

  verifyShowApprovedVisitorAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersApprovedVisitorValue().should('contain.text', expected)
    return this
  }

  private checkAnswersTitleValue = (): PageElement => cy.get('.check-answers-title-value')

  private checkAnswersNameValue = (): PageElement => cy.get('.check-answers-name-value')

  private checkAnswersDobValue = (): PageElement => cy.get('.check-answers-dob-value')

  private checkAnswersRelationshipValue = (): PageElement => cy.get('.check-answers-relationship-to-prisoner-value')

  private checkAnswersRelationshipTypeValue = (): PageElement => cy.get('.check-answers-relationship-type-value')

  private checkAnswersEmergencyContactValue = (): PageElement => cy.get('.check-answers-emergency-contact-value')

  private checkAnswersNextOfKinValue = (): PageElement => cy.get('.check-answers-next-of-kin-value')

  private checkAnswersCommentsValue = (): PageElement => cy.get('.check-answers-comments-value')

  private checkAnswersApprovedVisitorValue = (): PageElement => cy.get('.check-answers-approved-visitor-value')

  private checkAnswersGenderValue = (): PageElement => cy.get('.check-answers-gender-value')

  private checkAnswersDomesticStatusValue = (): PageElement => cy.get('.check-answers-domestic-status-value')

  private checkAnswersStaffValue = (): PageElement => cy.get('.check-answers-is-staff-value')

  private checkAnswersLanguageValue = (): PageElement => cy.get('.check-answers-language-value')

  private checkAnswersInterpreterValue = (): PageElement => cy.get('.check-answers-interpreter-value')

  private changeDateOfBirthLink = (): PageElement => cy.get('[data-qa=change-dob-link]')

  private changeRelationshipLink = (): PageElement => cy.get('[data-qa=change-relationship-to-prisoner-link]')

  private changeRelationshipTypeLink = (): PageElement => cy.get('[data-qa=change-relationship-type-link]')

  private changeEmergencyContactLink = (): PageElement => cy.get('[data-qa=change-emergency-contact-link]')

  private changeCommentsLink = (): PageElement => cy.get('[data-qa=change-comments-link]')
}
