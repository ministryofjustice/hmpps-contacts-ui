import Page, { PageElement } from './page'

export default class ManageContactDetailsPage extends Page {
  constructor(name: string) {
    super(`Contact details - ${name}`)
  }

  verifyShowNamesValueAs(expected: string): ManageContactDetailsPage {
    this.namesValue().should('contain.text', expected)
    return this
  }

  verifyShowDOBValueAs(expected: string): ManageContactDetailsPage {
    this.dobValue().should('contain.text', expected)
    return this
  }

  verifyShowDeceasedDateValueAs(expected: string): ManageContactDetailsPage {
    this.deceasedValue().should('contain.text', expected)
    return this
  }

  verifyShowisOverEighteenValueAs(expected: string): ManageContactDetailsPage {
    this.isOverEighteenValue().should('contain.text', expected)
    return this
  }

  verifyShowSpokenLanguageValueAs(expected: string): ManageContactDetailsPage {
    this.spokenLanguageValue().should('contain.text', expected)
    return this
  }

  clickChangeSpokenLanguageLik(): ManageContactDetailsPage {
    this.spokenLanguageLink().click()
    return this
  }

  clickAddPhoneNumberLink() {
    this.addPhoneNumberLink().click()
  }

  clickEditPhoneNumberLink(id: number) {
    this.editPhoneNumberLink(id).click()
  }

  clickDeletePhoneNumberLink(id: number) {
    this.deletePhoneNumberLink(id).click()
  }

  private namesValue = (): PageElement => cy.get('.manage-names-value')

  private dobValue = (): PageElement => cy.get('.manage-dob-value')

  private deceasedValue = (): PageElement => cy.get('.manage-deceased-date-value')

  private isOverEighteenValue = (): PageElement => cy.get('.manage-is-over-eighteen-value')

  private spokenLanguageValue = (): PageElement => cy.get('.manage-language-code-value')

  private spokenLanguageLink = (): PageElement => cy.get('[data-qa=manage-language-code-value]')

  private addPhoneNumberLink = (): PageElement => cy.get('[data-qa="add-phone-number"]')

  private editPhoneNumberLink = (id: number): PageElement => cy.get(`[data-qa="edit-phone-number-${id}"]`)

  private deletePhoneNumberLink = (id: number): PageElement => cy.get(`[data-qa="delete-phone-number-${id}"]`)
}
