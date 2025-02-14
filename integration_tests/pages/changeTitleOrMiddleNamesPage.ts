import Page, { PageElement } from './page'

export default class ChangeTitleOrMiddleNamesPage extends Page {
  constructor(contactName: string) {
    super(`Change the title or middle name for ${contactName}`)
  }

  hasLastName(lastName: string): ChangeTitleOrMiddleNamesPage {
    this.lastName().should('have.text', lastName)
    return this
  }

  hasFirstName(firstName: string): ChangeTitleOrMiddleNamesPage {
    this.firstName().should('have.text', firstName)
    return this
  }

  middleNamesHasFocus(): ChangeTitleOrMiddleNamesPage {
    this.middleNamesTextBox().should('have.focus')
    return this
  }

  hasMiddleNames(middleNames: string): ChangeTitleOrMiddleNamesPage {
    this.middleNamesTextBox().should('have.value', middleNames)
    return this
  }

  enterMiddleNames(value: string): ChangeTitleOrMiddleNamesPage {
    this.middleNamesTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearMiddleNames(): ChangeTitleOrMiddleNamesPage {
    this.middleNamesTextBox().clear()
    return this
  }

  titleHasFocus(): ChangeTitleOrMiddleNamesPage {
    this.titleSelect().should('have.focus')
    return this
  }

  hasTitle(value: string): ChangeTitleOrMiddleNamesPage {
    this.titleSelect().should('have.value', value)
    return this
  }

  selectTitle(value: string): ChangeTitleOrMiddleNamesPage {
    this.titleSelect().select(value)
    return this
  }

  selectBlankTitle(): ChangeTitleOrMiddleNamesPage {
    this.titleSelect().select(1)
    return this
  }

  private lastName = (): PageElement => cy.findByText('Last name').next()

  private firstName = (): PageElement => cy.findByText('First name').next()

  private middleNamesTextBox = (): PageElement => cy.get('#middleNames')

  private titleSelect = (): PageElement => cy.get('#title')
}
