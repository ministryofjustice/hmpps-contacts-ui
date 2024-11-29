import Page, { PageElement } from './page'

export default class CreateRestrictionCheckYourAnswersPage extends Page {
  constructor(restrictionClass: 'CONTACT_GLOBAL' | 'PRISONER_CONTACT') {
    super(
      restrictionClass === 'CONTACT_GLOBAL'
        ? 'Check your answers before saving the new global restriction'
        : 'Check your answers before saving the new prisoner-contact restriction',
    )
  }

  clickChangeTypeLink() {
    this.changeTypeLink().click()
  }

  clickChangeStartDateLink() {
    this.changeStartDateLink().click()
  }

  clickChangeExpiryDateLink() {
    this.changeExpiryDateLink().click()
  }

  clickChangeCommentsLink() {
    this.changeCommentsLink().click()
  }

  verifyShowsTypeAs(expected: string): CreateRestrictionCheckYourAnswersPage {
    this.checkAnswersTypeValue().should('contain.text', expected)
    return this
  }

  verifyShowsStartDateAs(expected: string): CreateRestrictionCheckYourAnswersPage {
    this.checkStartDateValue().should('contain.text', expected)
    return this
  }

  verifyShowExpiryDateAs(expected: string): CreateRestrictionCheckYourAnswersPage {
    this.checkAnswersExpiryDateValue().should('contain.text', expected)
    return this
  }

  verifyShowCommentsAs(expected: string): CreateRestrictionCheckYourAnswersPage {
    this.checkAnswersCommentsValue().should('contain.text', expected)
    return this
  }

  private checkAnswersTypeValue = (): PageElement => cy.get('.check-answers-type-value')

  private checkStartDateValue = (): PageElement => cy.get('.check-answers-start-date-value')

  private checkAnswersExpiryDateValue = (): PageElement => cy.get('.check-answers-expiry-date-value')

  private checkAnswersCommentsValue = (): PageElement => cy.get('.check-answers-comments-value')

  private changeTypeLink = (): PageElement => cy.get('[data-qa=change-type-link]')

  private changeStartDateLink = (): PageElement => cy.get('[data-qa=change-start-date-link]')

  private changeExpiryDateLink = (): PageElement => cy.get('[data-qa=change-expiry-date-link]')

  private changeCommentsLink = (): PageElement => cy.get('[data-qa=change-comments-link]')
}
