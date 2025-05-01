import Page, { PageElement } from './page'

export default class LinkExistingContactCYAPage extends Page {
  constructor() {
    super(`Check your answers`)
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

  verifyShowsNameAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersNameValue().should('contain.text', expected)
    return this
  }

  verifyShowRelationshipTypeAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersRelationshipTypeValue().should('contain.text', expected)
    return this
  }

  verifyShowRelationshipAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersRelationshipValue().should('contain.text', expected)
    return this
  }

  verifyShowIsEmergencyContactAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersEmergencyContactValue().should('contain.text', expected)
    return this
  }

  verifyShowIsNextOfKinAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersNextOfKinValue().should('contain.text', expected)
    return this
  }

  verifyShowCommentsAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersCommentsValue().should('contain.text', expected)
    return this
  }

  verifyShowApprovedVisitorAs(expected: string): LinkExistingContactCYAPage {
    this.checkAnswersApprovedVisitorValue().should('contain.text', expected)
    return this
  }

  private checkAnswersNameValue = (): PageElement => cy.findByText('Contact:').next()

  private checkAnswersRelationshipValue = (): PageElement => cy.get('.check-answers-relationship-to-prisoner-value')

  private checkAnswersRelationshipTypeValue = (): PageElement => cy.get('.check-answers-relationship-type-value')

  private checkAnswersEmergencyContactValue = (): PageElement => cy.get('.check-answers-emergency-contact-value')

  private checkAnswersApprovedVisitorValue = (): PageElement => cy.get('.check-answers-approved-visitor-value')

  private checkAnswersNextOfKinValue = (): PageElement => cy.get('.check-answers-next-of-kin-value')

  private checkAnswersCommentsValue = (): PageElement => cy.get('.check-answers-comments-value')

  private changeRelationshipLink = (): PageElement => cy.get('[data-qa=change-relationship-to-prisoner-link]')

  private changeRelationshipTypeLink = (): PageElement => cy.get('[data-qa=change-relationship-type-link]')

  private changeEmergencyContactLink = (): PageElement => cy.get('[data-qa=change-emergency-contact-link]')

  private changeNextOfKinLink = (): PageElement => cy.get('[data-qa=change-next-of-kin-link]')

  private changeCommentsLink = (): PageElement => cy.get('[data-qa=change-comments-link]')
}
