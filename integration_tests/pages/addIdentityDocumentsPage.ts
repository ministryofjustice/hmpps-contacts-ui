import Page, { PageElement } from './page'

export default class AddIdentityDocumentsPage extends Page {
  constructor(name: string) {
    super(`Add identity documents for ${name}`)
  }

  hasIdentity(index: number, value: string): AddIdentityDocumentsPage {
    this.identityTextBox(index).should('have.value', value)
    return this
  }

  enterIdentity(index: number, value: string): AddIdentityDocumentsPage {
    this.identityTextBox(index).clear().type(value, { delay: 0 })
    return this
  }

  selectType(index: number, value: string): AddIdentityDocumentsPage {
    this.typeSelect(index).select(value)
    return this
  }

  hasType(index: number, value: string): AddIdentityDocumentsPage {
    this.typeSelect(index).should('have.value', value)
    return this
  }

  enterIssuingAuthority(index: number, value: string): AddIdentityDocumentsPage {
    this.issuingAuthorityTextBox(index).clear().type(value, { delay: 0 })
    return this
  }

  hasIssuingAuthority(index: number, value: string): AddIdentityDocumentsPage {
    this.issuingAuthorityTextBox(index).should('have.value', value)
    return this
  }

  clickAddAnotherButton(): AddIdentityDocumentsPage {
    cy.findByRole('button', { name: 'Add another identity document' }).click()
    return this
  }

  clickRemoveButton(index: number): AddIdentityDocumentsPage {
    cy.findAllByRole('button', { name: 'Remove' }).eq(index).click()
    return this
  }

  private identityTextBox = (index: number): PageElement =>
    cy.findAllByRole('textbox', { name: 'Document number' }).eq(index)

  private issuingAuthorityTextBox = (index: number): PageElement =>
    cy.findAllByRole('textbox', { name: 'Issuing authority (optional)' }).eq(index)

  private typeSelect = (index: number): PageElement => cy.findAllByRole('combobox', { name: 'Document type' }).eq(index)
}
