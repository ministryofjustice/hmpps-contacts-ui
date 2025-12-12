import Page, { PageElement } from './page'

export default class ChangeNamesPage extends Page {
  constructor(contactName: string) {
    super(`Change the name for ${contactName}`)
  }

  hasLastName(lastName: string): ChangeNamesPage {
    this.lastNamesTextBox().should('have.value', lastName)
    return this
  }

  hasFirstName(firstName: string): ChangeNamesPage {
    this.firstNameTextBox().should('have.value', firstName)
    return this
  }

  hasMiddleNames(middleNames: string): ChangeNamesPage {
    this.middleNamesTextBox().should('have.value', middleNames)
    return this
  }

  enterFirstNames(value: string): ChangeNamesPage {
    this.firstNameTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterMiddleNames(value: string): ChangeNamesPage {
    this.middleNamesTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterLastNames(value: string): ChangeNamesPage {
    this.lastNamesTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearMiddleNames(): ChangeNamesPage {
    this.middleNamesTextBox().clear()
    return this
  }

  titleHasFocus(): ChangeNamesPage {
    this.titleSelect().should('have.focus')
    return this
  }

  hasTitle(value: string): ChangeNamesPage {
    this.titleSelect().should('have.value', value)
    return this
  }

  selectTitle(value: string): ChangeNamesPage {
    this.titleSelect().select(value)
    return this
  }

  selectBlankTitle(): ChangeNamesPage {
    this.titleSelect().select(1)
    return this
  }

  private firstNameTextBox = (): PageElement => cy.get('#firstName')

  private middleNamesTextBox = (): PageElement => cy.get('#middleNames')

  private lastNamesTextBox = (): PageElement => cy.get('#lastName')

  private titleSelect = (): PageElement => cy.get('#title')
}
