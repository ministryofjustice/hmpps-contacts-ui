import Page, { PageElement } from './page'

export default class CreateContactCheckYourAnswersPage extends Page {
  constructor() {
    super(`Check your answers`)
  }

  clickChangeNameLink() {
    this.changeNameLink().click()
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

  clickChangeNextOfKinLink() {
    this.changeNextOfKinLink().click()
  }

  clickChangeCommentsLink() {
    this.changeCommentsLink().click()
  }

  verifyShowsNameAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersNameValue().should('contain.text', expected)
    return this
  }

  verifyShowsDateOfBirthAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersDobValue().should('contain.text', expected)
    return this
  }

  verifyShowDeceasedDate(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersDeceasedValue().should('contain.text', expected)
    return this
  }

  verifyNoDeceasedDate(): CreateContactCheckYourAnswersPage {
    this.checkAnswersDeceasedValue().should('not.exist')
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

  verifyNameIsNotChangeable(): CreateContactCheckYourAnswersPage {
    this.changeNameLink().should('not.exist')
    return this
  }

  verifyDateOfBirthIsNotChangeable(): CreateContactCheckYourAnswersPage {
    this.changeDateOfBirthLink().should('not.exist')
    return this
  }

  private checkAnswersNameValue = (): PageElement => cy.get('.check-answers-name-value')

  private checkAnswersDobValue = (): PageElement => cy.get('.check-answers-dob-value')

  private checkAnswersDeceasedValue = (): PageElement => cy.get('.check-answers-deceased-value')

  private checkAnswersRelationshipValue = (): PageElement => cy.get('.check-answers-relationship-to-prisoner-value')

  private checkAnswersRelationshipTypeValue = (): PageElement => cy.get('.check-answers-relationship-type-value')

  private checkAnswersEmergencyContactValue = (): PageElement => cy.get('.check-answers-emergency-contact-value')

  private checkAnswersNextOfKinValue = (): PageElement => cy.get('.check-answers-next-of-kin-value')

  private checkAnswersCommentsValue = (): PageElement => cy.get('.check-answers-comments-value')

  private changeNameLink = (): PageElement => cy.get('[data-qa=change-name-link]')

  private changeDateOfBirthLink = (): PageElement => cy.get('[data-qa=change-dob-link]')

  private changeRelationshipLink = (): PageElement => cy.get('[data-qa=change-relationship-to-prisoner-link]')

  private changeRelationshipTypeLink = (): PageElement => cy.get('[data-qa=change-relationship-type-link]')

  private changeEmergencyContactLink = (): PageElement => cy.get('[data-qa=change-emergency-contact-link]')

  private changeNextOfKinLink = (): PageElement => cy.get('[data-qa=change-next-of-kin-link]')

  private changeCommentsLink = (): PageElement => cy.get('[data-qa=change-comments-link]')
}
