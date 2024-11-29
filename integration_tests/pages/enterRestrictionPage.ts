import Page, { PageElement } from './page'

export default class EnterRestrictionPage extends Page {
  constructor(name: string, restrictionClass: 'CONTACT_GLOBAL' | 'PRISONER_CONTACT') {
    super(
      restrictionClass === 'CONTACT_GLOBAL'
        ? `Add a new global restriction for ${name}`
        : `Add a new prisoner-contact restriction`,
    )
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
    this.startDateTextBox().clear().type(value)
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
    this.expiryDateTextBox().clear().type(value)
    return this
  }

  clearExpiryDate(): EnterRestrictionPage {
    this.expiryDateTextBox().clear()
    return this
  }

  enterComments(value: string): EnterRestrictionPage {
    this.commentsTextBox().clear().type(value)
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
