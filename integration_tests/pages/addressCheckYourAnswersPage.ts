import Page, { PageElement } from './page'

export default class AddressCheckYourAnswersPage extends Page {
  constructor(type: string, name: string) {
    super(`Check your answers before saving the new ${type} for ${name}`)
  }

  clickChangeAddressTypeLink() {
    this.changeAddressTypeLink().click()
  }

  verifyShowsAddressTypeAs(expected: string): AddressCheckYourAnswersPage {
    this.checkAnswersAddressTypeValue().should('contain.text', expected)
    return this
  }

  clickChangeAddressLink() {
    this.changeAddressLink().click()
  }

  verifyShowsAddressAs(expected: string): AddressCheckYourAnswersPage {
    const regex = new RegExp(expected.split('<br>').join('<br>\\s+?'))
    this.checkAnswersAddressValue().then(element => expect(element.html()).match(regex))
    return this
  }

  clickChangeNoFixedAddressLink() {
    this.changeNoFixedAddressLink().click()
  }

  verifyShowsNoFixedAddressAs(expected: string): AddressCheckYourAnswersPage {
    this.checkNoFixedAddressValue().should('contain.text', expected)
    return this
  }

  clickChangeFromDateLink() {
    this.changeFromDateLink().click()
  }

  verifyShowsFromDateAs(expected: string): AddressCheckYourAnswersPage {
    this.checkFromDateValue().should('contain.text', expected)
    return this
  }

  clickChangeToDateLink() {
    this.changeToDateLink().click()
  }

  verifyShowsToDateAs(expected: string): AddressCheckYourAnswersPage {
    this.checkToDateValue().should('contain.text', expected)
    return this
  }

  clickChangePrimaryAddressLink() {
    this.changePrimaryAddressLink().click()
  }

  verifyShowsPrimaryAddressAs(expected: string): AddressCheckYourAnswersPage {
    this.checkPrimaryAddressValue().should('contain.text', expected)
    return this
  }

  clickChangeMailAddressLink() {
    this.changeMailAddressLink().click()
  }

  verifyShowsMailAddressAs(expected: string): AddressCheckYourAnswersPage {
    this.checkMailAddressValue().should('contain.text', expected)
    return this
  }

  clickChangeCommentsLink() {
    this.changeCommentsLink().click()
  }

  verifyShowsCommentsAs(expected: string): AddressCheckYourAnswersPage {
    this.checkCommentsValue().should('contain.text', expected)
    return this
  }

  private checkAnswersAddressTypeValue = (): PageElement => cy.get('.check-answers-type-value')

  private changeAddressTypeLink = (): PageElement => cy.get('[data-qa=change-type-link]')

  private checkAnswersAddressValue = (): PageElement => cy.get('.check-answers-address-value')

  private changeAddressLink = (): PageElement => cy.get('[data-qa=change-address-link]')

  private checkNoFixedAddressValue = (): PageElement => cy.get('.check-answers-nfa-value')

  private changeNoFixedAddressLink = (): PageElement => cy.get('[data-qa=change-nfa-link]')

  private checkFromDateValue = (): PageElement => cy.get('.check-answers-from-date-value')

  private changeFromDateLink = (): PageElement => cy.get('[data-qa=change-from-date-link]')

  private checkToDateValue = (): PageElement => cy.get('.check-answers-to-date-value')

  private changeToDateLink = (): PageElement => cy.get('[data-qa=change-to-date-link]')

  private checkPrimaryAddressValue = (): PageElement => cy.get('.check-answers-primary-value')

  private changePrimaryAddressLink = (): PageElement => cy.get('[data-qa=change-primary-link]')

  private checkMailAddressValue = (): PageElement => cy.get('.check-answers-mail-value')

  private changeMailAddressLink = (): PageElement => cy.get('[data-qa=change-mail-link]')

  private checkCommentsValue = (): PageElement => cy.get('.check-answers-comments-value')

  private changeCommentsLink = (): PageElement => cy.get('[data-qa=change-comments-link]')
}
