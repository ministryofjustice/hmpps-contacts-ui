import Page, { PageElement } from './page'

export default class EnterRestrictionPage extends Page {
  constructor(title: string) {
    super(title)
  }

  selectType(value: string): EnterRestrictionPage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): EnterRestrictionPage {
    this.typeSelect().should('have.value', value)
    return this
  }

  hasStartDate(value: string): EnterRestrictionPage {
    this.startDateTextBox().should('have.value', value)
    return this
  }

  enterStartDate(value: string): EnterRestrictionPage {
    this.startDateTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearStartDate(): EnterRestrictionPage {
    this.startDateTextBox().clear()
    return this
  }

  hasExpiryDate(value: string): EnterRestrictionPage {
    this.expiryDateTextBox().should('have.value', value)
    return this
  }

  enterExpiryDate(value: string): EnterRestrictionPage {
    this.expiryDateTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearExpiryDate(): EnterRestrictionPage {
    this.expiryDateTextBox().clear()
    return this
  }

  enterComments(value: string): EnterRestrictionPage {
    this.commentsTextBox().clear().type(value, { delay: 0 })
    return this
  }

  hasComments(value: string): EnterRestrictionPage {
    this.commentsTextBox().should('have.value', value)
    return this
  }

  clearComments(): EnterRestrictionPage {
    this.commentsTextBox().clear()
    return this
  }

  private typeSelect = (): PageElement => cy.get('#type')

  private startDateTextBox = (): PageElement => cy.get('#startDate')

  private expiryDateTextBox = (): PageElement => cy.get('#expiryDate')

  private commentsTextBox = (): PageElement => cy.get('#comments')
}
