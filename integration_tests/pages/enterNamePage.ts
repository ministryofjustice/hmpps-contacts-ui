import Page, { PageElement } from './page'

export default class EnterNamePage extends Page {
  constructor() {
    super('What is the contacts name')
  }

  enterLastName(value: string): EnterNamePage {
    this.lastNameTextBox().type(value)
    return this
  }

  enterFirstName(value: string): EnterNamePage {
    this.firstNameTextBox().type(value)
    return this
  }

  enterMiddleName(value: string): EnterNamePage {
    this.middleNameTextBox().type(value)
    return this
  }

  selectTitle(value: string): EnterNamePage {
    this.titleSelect().select(value)
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  private lastNameTextBox = (): PageElement => cy.get('#lastName')

  private firstNameTextBox = (): PageElement => cy.get('#firstName')

  private middleNameTextBox = (): PageElement => cy.get('#middleName')

  private titleSelect = (): PageElement => cy.get('#title')

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')
}
