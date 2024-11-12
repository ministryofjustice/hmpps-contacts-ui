import Page, { PageElement } from './page'

export default class EnterNamePage extends Page {
  constructor() {
    super("What is the contact's name?")
  }

  hasLastName(lastName: string): EnterNamePage {
    this.lastNameTextBox().should('have.value', lastName)
    return this
  }

  enterLastName(value: string): EnterNamePage {
    this.lastNameTextBox().clear().type(value)
    return this
  }

  hasFirstName(firstName: string): EnterNamePage {
    this.firstNameTextBox().should('have.value', firstName)
    return this
  }

  enterFirstName(value: string): EnterNamePage {
    this.firstNameTextBox().clear().type(value)
    return this
  }

  hasMiddleNames(middleNames: string): EnterNamePage {
    this.middleNamesTextBox().should('have.value', middleNames)
    return this
  }

  enterMiddleNames(value: string): EnterNamePage {
    this.middleNamesTextBox().clear().type(value)
    return this
  }

  clearMiddleNames(): EnterNamePage {
    this.middleNamesTextBox().clear()
    return this
  }

  hasTitle(value: string): EnterNamePage {
    this.titleSelect().should('have.value', value)
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
