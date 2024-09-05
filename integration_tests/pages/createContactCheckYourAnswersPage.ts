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

  verifyShowsNameAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersNameValue().should('contain.text', expected)
    return this
  }

  verifyShowsDateOfBirthAs(expected: string): CreateContactCheckYourAnswersPage {
    this.checkAnswersDobValue().should('contain.text', expected)
    return this
  }

  private createPrisonerContactButton = (): PageElement => cy.get('[data-qa=create-prisoner-contact-button]')

  private checkAnswersNameValue = (): PageElement => cy.get('.check-answers-name-value')

  private checkAnswersDobValue = (): PageElement => cy.get('.check-answers-dob-value')

  private changeNameLink = (): PageElement => cy.get('[data-qa=change-name-link]')
}
