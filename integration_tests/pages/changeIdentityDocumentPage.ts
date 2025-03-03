import Page, { PageElement } from './page'

export default class ChangeIdentityDocumentPage extends Page {
  constructor(name: string) {
    super(`Update an identity document for ${name}`)
  }

  hasIdentity(value: string): ChangeIdentityDocumentPage {
    this.identityTextBox().should('have.value', value)
    return this
  }

  enterIdentity(value: string): ChangeIdentityDocumentPage {
    this.identityTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearIdentity(): ChangeIdentityDocumentPage {
    this.identityTextBox().clear()
    return this
  }

  selectType(value: string): ChangeIdentityDocumentPage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): ChangeIdentityDocumentPage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterIssuingAuthority(value: string): ChangeIdentityDocumentPage {
    this.issuingAuthorityTextBox().clear().type(value, { delay: 0 })
    return this
  }

  hasIssuingAuthority(value: string): ChangeIdentityDocumentPage {
    this.issuingAuthorityTextBox().should('have.value', value)
    return this
  }

  clearIssuingAuthority(): ChangeIdentityDocumentPage {
    this.issuingAuthorityTextBox().clear()
    return this
  }

  private identityTextBox = (): PageElement => cy.get('#identity')

  private issuingAuthorityTextBox = (): PageElement => cy.get('#issuingAuthority')

  private typeSelect = (): PageElement => cy.get('#type')
}
