import Page, { PageElement } from './page'

export default class SearchContactPage extends Page {
  constructor() {
    super('Search for Contact')
  }

  enterFirstName(value: string): SearchContactPage {
    this.firstNameTextBox().clear().type(value)
    return this
  }

  enterMiddleName(value: string): SearchContactPage {
    this.middleNameTextBox().clear().type(value)
    return this
  }

  enterLastName(value: string): SearchContactPage {
    this.lastNameTextBox().clear().type(value)
    return this
  }

  enterDay(value: string): SearchContactPage {
    this.dayTextBox().clear().type(value)
    return this
  }

  enterMonth(value: string): SearchContactPage {
    this.monthTextBox().clear().type(value)
    return this
  }

  enterYear(value: string): SearchContactPage {
    this.yearTextBox().clear().type(value)
    return this
  }

  clickSearchButton() {
    this.searchButton().click()
  }

  verifyShowsNameAs(expected: string): SearchContactPage {
    this.checkContactSearchTableNameValue().should('contain.text', expected)
    return this
  }

  verifyShowsDobAs(expected: string): SearchContactPage {
    this.checkContactSearchTableDobValue().should('contain.text', expected)
    return this
  }

  verifyShowsAddressAs(expected: string): SearchContactPage {
    this.checkContactSearchTableAddressValue().should('contain.text', expected)
    return this
  }

  verifyShowsTheContactIsNotListedAs(expected: string): SearchContactPage {
    this.theContactIsNotListedLink().should('contain.text', expected)
    return this
  }

  private firstNameTextBox = (): PageElement => cy.get('#firstName')

  private middleNameTextBox = (): PageElement => cy.get('#middleName')

  private lastNameTextBox = (): PageElement => cy.get('#lastName')

  private dayTextBox = (): PageElement => cy.get('#day')

  private monthTextBox = (): PageElement => cy.get('#month')

  private yearTextBox = (): PageElement => cy.get('#year')

  private searchButton = (): PageElement => cy.get('[data-qa=search-button]')

  private theContactIsNotListedLink = (): PageElement => cy.get('[data-qa="no-result-message"]')

  private checkContactSearchTableNameValue = (): PageElement =>
    cy.get('.govuk-table__body > :nth-child(1) > :nth-child(1)')

  private checkContactSearchTableDobValue = (): PageElement =>
    cy.get('.govuk-table__body > :nth-child(1) > :nth-child(2)')

  private checkContactSearchTableAddressValue = (): PageElement =>
    cy.get('.govuk-table__body > :nth-child(1) > :nth-child(3)')
}
