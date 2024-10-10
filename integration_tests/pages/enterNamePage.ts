import Page, { PageElement } from './page'

export default class EnterNamePage extends Page {
  constructor() {
    super("What is the contact's name?")
  }

  enterLastName(value: string): EnterNamePage {
    this.lastNameTextBox().clear().type(value)
    return this
  }

  enterFirstName(value: string): EnterNamePage {
    this.firstNameTextBox().clear().type(value)
    return this
  }

  enterMiddleNames(value: string): EnterNamePage {
    this.middleNamesTextBox().clear().type(value)
    return this
  }

  selectTitle(value: string): EnterNamePage {
    this.titleSelect().select(value)
    return this
  }

  private lastNameTextBox = (): PageElement => cy.get('#lastName')

  private firstNameTextBox = (): PageElement => cy.get('#firstName')

  private middleNamesTextBox = (): PageElement => cy.get('#middleNames')

  private titleSelect = (): PageElement => cy.get('#title')
}
