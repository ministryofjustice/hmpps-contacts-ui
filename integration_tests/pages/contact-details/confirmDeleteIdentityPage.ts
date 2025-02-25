import Page, { PageElement } from '../page'

export default class ConfirmDeleteIdentityPage extends Page {
  constructor(name: string) {
    super(`Are you sure you want to delete this identity document for ${name}?`)
  }

  hasIdentityNumber(value: string): ConfirmDeleteIdentityPage {
    this.identityNumberValue().should('contain.text', value)
    return this
  }

  hasType(value: string): ConfirmDeleteIdentityPage {
    this.typeValue().should('contain.text', value)
    return this
  }

  hasIssuingAuthority(value: string): ConfirmDeleteIdentityPage {
    this.issuingAuthorityValue().should('contain.text', value)
    return this
  }

  private identityNumberValue = (): PageElement => cy.get('.identity-number-value')

  private issuingAuthorityValue = (): PageElement => cy.get('.issuing-authority-value')

  private typeValue = (): PageElement => cy.get('.type-value')
}
