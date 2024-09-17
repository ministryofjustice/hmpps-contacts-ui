import { PageElement } from './page'
import ContinuablePage from './continuablePage'

export default class EnterNamePage extends ContinuablePage {
  constructor() {
    super('What is the contacts name?')
  }

  enterLastName(value: string): EnterNamePage {
    this.lastNameTextBox().clear().type(value)
    return this
  }

  enterFirstName(value: string): EnterNamePage {
    this.firstNameTextBox().clear().type(value)
    return this
  }

  enterMiddleName(value: string): EnterNamePage {
    this.middleNameTextBox().clear().type(value)
    return this
  }

  selectTitle(value: string): EnterNamePage {
    this.titleSelect().select(value)
    return this
  }

  private lastNameTextBox = (): PageElement => cy.get('#lastName')

  private firstNameTextBox = (): PageElement => cy.get('#firstName')

  private middleNameTextBox = (): PageElement => cy.get('#middleName')

  private titleSelect = (): PageElement => cy.get('#title')
}
