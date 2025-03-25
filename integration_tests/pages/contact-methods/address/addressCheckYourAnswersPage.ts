import Page, { PageElement } from '../../page'

export default class AddressCheckYourAnswersPage extends Page {
  constructor(name: string) {
    super(`Check your answers before adding a new address for ${name}`)
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

  verifyShowsNoFixedAddressAs(expected: 'Yes' | 'No'): AddressCheckYourAnswersPage {
    if (expected === 'Yes') {
      this.checkAnswersAddressValue().should('contain.text', 'No fixed address')
    } else {
      this.checkAnswersAddressValue().should('not.contain.text', 'No fixed address')
    }
    return this
  }

  clickChangeDatesLink() {
    this.changeDatesLink().click()
  }

  verifyShowsDatesAs(expected: string): AddressCheckYourAnswersPage {
    this.checkDateRangeValue().should('contain.text', expected)
    return this
  }

  clickChangePrimaryOrPostalAddressLink() {
    this.changePrimaryOrPostalAddressLink().click()
  }

  verifyShowsPrimaryOrPostalAddressAs(expected: string): AddressCheckYourAnswersPage {
    this.checkPrimaryOrPostalAddressValue().should('contain.text', expected)
    return this
  }

  clickChangeCommentsLink() {
    this.changeCommentsLink().click()
  }

  verifyShowsCommentsAs(expected: string): AddressCheckYourAnswersPage {
    this.checkCommentsValue().should('contain.text', expected)
    return this
  }

  clickChangePhoneNumbersLink() {
    cy.findByRole('link', { name: /Change the information about the phone number for this address/ }).click()
  }

  clickDeletePhoneNumberLink(typeDescription: string) {
    cy.findByRole('link', {
      name: new RegExp(`Delete the information about the ${typeDescription} phone number for this address`),
    }).click()
  }

  verifyNoPhoneNumbers() {
    cy.get('dt:contains("Address phone numbers")').next().should('contain.text', 'Not provided')
    return this
  }

  verifyShowsPhoneNumber(type: string, expected: string) {
    cy.get(`dt:contains("${type}")`).next().should('contain.text', expected)
    return this
  }

  private checkAnswersAddressTypeValue = (): PageElement => cy.get('.check-answers-type-value')

  private changeAddressTypeLink = (): PageElement => cy.get('[data-qa=change-type-link]')

  private checkAnswersAddressValue = (): PageElement => cy.get('.check-answers-address-value')

  private changeAddressLink = (): PageElement => cy.get('[data-qa=change-address-link]')

  private checkDateRangeValue = (): PageElement => cy.get('.check-answers-dates-value')

  private changeDatesLink = (): PageElement => cy.get('[data-qa=change-dates-link]')

  private checkPrimaryOrPostalAddressValue = (): PageElement => cy.get('.check-answers-flags-value')

  private changePrimaryOrPostalAddressLink = (): PageElement => cy.get('[data-qa=change-flags-link]')

  private checkCommentsValue = (): PageElement => cy.get('.check-answers-comments-value')

  private changeCommentsLink = (): PageElement => cy.get('[data-qa=change-comments-link]')
}
