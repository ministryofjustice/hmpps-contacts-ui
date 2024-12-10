import Page, { PageElement } from './page'

export default class EnterAddressMetadataPage extends Page {
  constructor(type: string, name: string) {
    super(`Provide further details about the ${type} for ${name}`)
  }

  hasFromMonth(value: string): EnterAddressMetadataPage {
    this.fromMonthTextbox().should('have.value', value)
    return this
  }

  enterFromMonth(value: string): EnterAddressMetadataPage {
    this.clearFromMonth()
    this.fromMonthTextbox().type(value)
    return this
  }

  clearFromMonth(): EnterAddressMetadataPage {
    this.fromMonthTextbox().clear()
    return this
  }

  hasFromYear(value: string): EnterAddressMetadataPage {
    this.fromYearTextbox().should('have.value', value)
    return this
  }

  enterFromYear(value: string): EnterAddressMetadataPage {
    this.clearFromYear()
    this.fromYearTextbox().type(value)
    return this
  }

  clearFromYear(): EnterAddressMetadataPage {
    this.fromYearTextbox().clear()
    return this
  }

  hasToMonth(value: string): EnterAddressMetadataPage {
    this.toMonthTextbox().should('have.value', value)
    return this
  }

  enterToMonth(value: string): EnterAddressMetadataPage {
    this.clearToMonth()
    this.toMonthTextbox().type(value)
    return this
  }

  clearToMonth(): EnterAddressMetadataPage {
    this.toMonthTextbox().clear()
    return this
  }

  hasToYear(value: string): EnterAddressMetadataPage {
    this.toYearTextbox().should('have.value', value)
    return this
  }

  enterToYear(value: string): EnterAddressMetadataPage {
    this.clearToYear()
    this.toYearTextbox().type(value)
    return this
  }

  clearToYear(): EnterAddressMetadataPage {
    this.toYearTextbox().clear()
    return this
  }

  selectPrimaryAddress(value: 'Yes' | 'No'): EnterAddressMetadataPage {
    this.primaryAddressRadio(value).click()
    return this
  }

  hasPrimaryAddress(value: 'Yes' | 'No'): EnterAddressMetadataPage {
    this.primaryAddressRadio(value).should('be.checked')
    return this
  }

  selectMailAddress(value: 'Yes' | 'No'): EnterAddressMetadataPage {
    this.mailAddressRadio(value).click()
    return this
  }

  hasMailAddress(value: 'Yes' | 'No'): EnterAddressMetadataPage {
    this.mailAddressRadio(value).should('be.checked')
    return this
  }

  hasComments(value: string): EnterAddressMetadataPage {
    this.commentsTextbox().should('have.value', value)
    return this
  }

  enterComments(value: string): EnterAddressMetadataPage {
    this.clearComments()
    this.commentsTextbox().type(value)
    return this
  }

  clearComments(): EnterAddressMetadataPage {
    this.commentsTextbox().clear()
    return this
  }

  private fromMonthTextbox = (): PageElement => cy.get('#fromMonth')

  private fromYearTextbox = (): PageElement => cy.get('#fromYear')

  private toMonthTextbox = (): PageElement => cy.get('#toMonth')

  private toYearTextbox = (): PageElement => cy.get('#toYear')

  private commentsTextbox = (): PageElement => cy.get('#comments')

  private primaryAddressRadio = (value: 'Yes' | 'No'): PageElement => cy.get(`#primaryAddress${value}`)

  private mailAddressRadio = (value: 'Yes' | 'No'): PageElement => cy.get(`#primaryAddress${value}`)
}
