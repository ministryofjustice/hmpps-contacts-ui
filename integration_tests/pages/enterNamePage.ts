import Page, { PageElement } from './page'

export default class EnterNamePage extends Page {
  constructor() {
    super('What’s the name of the contact you want to link to')
  }

  enterLastName(value: string): EnterNamePage {
    this.lastNameTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterFirstName(value: string): EnterNamePage {
    this.firstNameTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterMiddleNames(value: string): EnterNamePage {
    this.middleNamesTextBox().clear().type(value, { delay: 0 })
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
