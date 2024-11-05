import Page, { PageElement } from './page'

export default class EnterIdentityPage extends Page {
  constructor(name: string) {
    super(`What is the identity number for ${name}?`)
  }

  hasIdentity(value: string): EnterIdentityPage {
    this.identityTextBox().should('have.value', value)
    return this
  }

  enterIdentity(value: string): EnterIdentityPage {
    this.identityTextBox().clear().type(value)
    return this
  }

  clearIdentity(): EnterIdentityPage {
    this.identityTextBox().clear()
    return this
  }

  selectType(value: string): EnterIdentityPage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): EnterIdentityPage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterIssuingAuthority(value: string): EnterIdentityPage {
    this.issuingAuthorityTextBox().clear().type(value)
    return this
  }

  hasIssuingAuthority(value: string): EnterIdentityPage {
    this.issuingAuthorityTextBox().should('have.value', value)
    return this
  }

  clearIssuingAuthority(): EnterIdentityPage {
    this.issuingAuthorityTextBox().clear()
    return this
  }

  private identityTextBox = (): PageElement => cy.get('#identity')

  private issuingAuthorityTextBox = (): PageElement => cy.get('#issuingAuthority')

  private typeSelect = (): PageElement => cy.get('#type')
}
