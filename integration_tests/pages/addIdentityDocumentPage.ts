import Page, { PageElement } from './page'

export default class AddIdentityDocumentPage extends Page {
  constructor(name: string, isOptional: boolean = false) {
    super(`Add an identity document for ${name}${isOptional ? ' (optional)' : ''}`)
  }

  hasIdentity(value: string): AddIdentityDocumentPage {
    this.identityTextBox().should('have.value', value)
    return this
  }

  enterIdentity(value: string): AddIdentityDocumentPage {
    this.identityTextBox().clear().type(value, { delay: 0 })
    return this
  }

  selectType(value: string): AddIdentityDocumentPage {
    this.typeSelect().select(value)
    return this
  }

  hasType(value: string): AddIdentityDocumentPage {
    this.typeSelect().should('have.value', value)
    return this
  }

  enterIssuingAuthority(value: string): AddIdentityDocumentPage {
    this.issuingAuthorityTextBox().clear().type(value, { delay: 0 })
    return this
  }

  clearIssuingAuthority(): AddIdentityDocumentPage {
    this.issuingAuthorityTextBox().clear()
    return this
  }

  hasIssuingAuthority(value: string): AddIdentityDocumentPage {
    this.issuingAuthorityTextBox().should('have.value', value)
    return this
  }

  private identityTextBox = (): PageElement => cy.findAllByRole('textbox', { name: 'Document number' })

  private issuingAuthorityTextBox = (): PageElement =>
    cy.findAllByRole('textbox', { name: 'Issuing authority (optional)' })

  private typeSelect = (): PageElement => cy.findAllByRole('combobox', { name: 'Document type' })
}
