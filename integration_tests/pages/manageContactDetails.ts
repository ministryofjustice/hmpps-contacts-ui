import Page, { PageElement } from './page'

export default class ManageContactDetailsPage extends Page {
  constructor(name: string) {
    super(`Contact details - ${name}`)
  }

  verifyShowNamesValueAs(expected: string): ManageContactDetailsPage {
    this.namesValue().should('contain.text', expected)
    return this
  }

  verifyGenderValueAs(expected: string): ManageContactDetailsPage {
    this.genderValue().should('contain.text', expected)
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

  verifyShowIdentityNumberValueAs(expected: string, type: string): ManageContactDetailsPage {
    this.identityNumberValue(type).should('contain.text', expected)
    return this
  }

  verifyShowSpokenLanguageValueAs(expected: string): ManageContactDetailsPage {
    this.spokenLanguageValue().should('contain.text', expected)
    return this
  }

  clickChangeSpokenLanguageLink(): ManageContactDetailsPage {
    this.spokenLanguageLink().click()
    return this
  }

  verifyShowNeedsInterpreterValueAs(expected: string): ManageContactDetailsPage {
    this.needsInterpreterValue().should('contain.text', expected)
    return this
  }

  verifyDomesticStatusValueAs(expected: string): ManageContactDetailsPage {
    this.domesticStatusValue().should('contain.text', expected)
    return this
  }

  verifyEmailValueAs(expected: string, id: number): ManageContactDetailsPage {
    this.emailValue(id).should('contain.text', expected)
    return this
  }

  clickChangeGenderLink() {
    this.selectGenderLink().click()
  }

  clickAddInterpreterLink() {
    this.addInterpreterLink().click()
  }

  verifyShowStaffStatusValueAs(expected: string): ManageContactDetailsPage {
    this.staffStatusValue().should('contain.text', expected)
    return this
  }

  clickChangeStaffStatusLink() {
    this.changeStaffStatusLink().click()
  }

  clickEditEmergencyContactLink() {
    this.editEmergencyContactLink().click()
  }

  clickAddPhoneNumberLink() {
    this.addPhoneNumberLink().click()
  }

  clickEditPhoneNumberLink(id: number) {
    this.editPhoneNumberLink(id).click()
  }

  clickChangeDomesticStatusLink() {
    this.selectDomesticStatusLink().click()
  }

  clickDeletePhoneNumberLink(id: number) {
    this.deletePhoneNumberLink(id).click()
  }

  clickChangeDateOfBirthLink(id: number) {
    this.changeDateOfBirthLink(id).click()
  }

  clickChangeEstimatedDateOfBirthLink(id: number) {
    this.changeEstimatedDateOfBirthLink(id).click()
  }

  clickChangeNameLink() {
    this.changeNameLink().click()
  }

  private namesValue = (): PageElement => cy.get('.manage-names-value')

  private genderValue = (): PageElement => cy.get('.manage-gender-value')

  private dobValue = (): PageElement => cy.get('.manage-dob-value')

  private deceasedValue = (): PageElement => cy.get('.manage-deceased-date-value')

  private isOverEighteenValue = (): PageElement => cy.get('.manage-is-over-eighteen-value')

  private identityNumberValue = (type: string): PageElement => cy.get(`.confirm-${type}-value`)

  private spokenLanguageValue = (): PageElement => cy.get('.manage-language-code-value')

  private needsInterpreterValue = (): PageElement => cy.get('.manage-interpreter-needs-value')

  private spokenLanguageLink = (): PageElement => cy.get('[data-qa=add-language]')

  private addInterpreterLink = (): PageElement => cy.get('[data-qa="add-interpreter"]')

  private staffStatusValue = (): PageElement => cy.get('.manage-staff-status')

  private changeStaffStatusLink = (): PageElement => cy.get('[data-qa=manage-staff-status-link]')

  private addPhoneNumberLink = (): PageElement => cy.get('[data-qa="add-phone-number"]')

  private editPhoneNumberLink = (id: number): PageElement => cy.get(`[data-qa="edit-phone-number-${id}"]`)

  private editEmergencyContactLink = (): PageElement => cy.get(`[data-qa="change-emergency-contact-link"]`)

  private changeDateOfBirthLink = (id: number): PageElement => cy.get(`[data-qa="change-dob-${id}"]`)

  private changeEstimatedDateOfBirthLink = (id: number): PageElement => cy.get(`[data-qa="change-estimated-dob-${id}"]`)

  private changeNameLink = (): PageElement => cy.get(`[data-qa="change-name-link"]`)

  private domesticStatusValue = (): PageElement => cy.get('.manage-domestic-status-value')

  private selectDomesticStatusLink = (): PageElement => cy.get('[data-qa="select-domestic-status"]')

  private deletePhoneNumberLink = (id: number): PageElement => cy.get(`[data-qa="delete-phone-number-${id}"]`)

  private selectGenderLink = (): PageElement => cy.get('[data-qa="select-gender"]')

  clickAddIdentityLink() {
    this.addIdentityLink().click()
  }

  clickEditIdentityLink(id: number) {
    this.editIdentityLink(id).click()
  }

  clickDeleteIdentityLink(id: number) {
    this.deleteIdentityLink(id).click()
  }

  private addIdentityLink = (): PageElement => cy.get('[data-qa="add-identity-number"]')

  private editIdentityLink = (id: number): PageElement => cy.get(`[data-qa="edit-identity-number-${id}"]`)

  private deleteIdentityLink = (id: number): PageElement => cy.get(`[data-qa="delete-identity-number-${id}"]`)

  private emailValue = (id: number): PageElement => cy.get(`.confirm-email-${id}-value`)

  verifyShowIsEmergencyContactAs(expected: string) {
    this.checkAnswersEmergencyContactValue().should('contain.text', expected)
  }

  private checkAnswersEmergencyContactValue = (): PageElement => cy.get('.emergency-contact-value')
}
