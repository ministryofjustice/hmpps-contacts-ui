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

  verifyShowMostRelevantAddressLabelValueAs(expected: string): ManageContactDetailsPage {
    this.mostRelevantAddressLabel().should('contain.text', expected)
    return this
  }

  verifyShowConfirmAddressValueAs(expected: string): ManageContactDetailsPage {
    this.confirmAddressValue().should('contain.text', expected)
    return this
  }

  clickChangeStaffStatusLink() {
    this.changeStaffStatusLink().click()
  }

  clickEditEmergencyContactLink() {
    this.editEmergencyContactLink().click()
  }

  clickEditNextOfKinContactLink() {
    this.editNextOfKinContactLink().click()
  }

  clickEditRelationshipStatusLink() {
    this.editRelationshipStatusLink().click()
  }

  clickEditRelationshipCommentsLink() {
    this.editRelationshipCommentsLink().click()
  }

  clickViewAllAddressesLink() {
    this.viewAllAddressesLink().click()
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

  clickDeleteEmailLink(id: number) {
    this.deleteEmailLink(id).click()
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

  clickChangeRelationshipLink() {
    this.changeRelationshipLink().click()
  }

  clickAddEmailLink() {
    this.addEmailLink().click()
  }

  clickEditEmailLink(id: number) {
    this.editEmailLink(id).click()
  }

  clickRestrictionsTab(count: string = '1') {
    this.getRestrictionsTab().should('contain.text', `Restrictions(${count})`).click()
    return this
  }

  clickAddPrisonerContactRestriction() {
    this.getAddPrisonerContactRestriction().should('contain.text', `Add prisoner-contact restriction`).click()
    return this
  }

  clickAddGlobalRestriction() {
    this.getAddGlobalRestriction().should('contain.text', `Add global restriction`).click()
    return this
  }

  clickManageGlobalRestriction() {
    this.getManageGlobalRestriction().should('contain.text', `Manage`).click()
    return this
  }

  clickManagePrisonerContactRestriction() {
    this.getManagePrisonerContactRestriction().should('contain.text', `Manage`).click()
    return this
  }

  checkPrisonerContactRestrictionsCardTitle() {
    this.getPrisonerContactRestrictionsCardTitle().should(
      'contain.text',
      `Prisoner-contact restrictions between prisoner John Smith and contact Jones Mason`,
    )
    return this
  }

  checkGlobalRestrictionsCardTitle() {
    this.getGlobalRestrictionsCardTitle().should('contain.text', `Global restrictions for contact Jones Mason`)
    return this
  }

  checkPrisonerContactRestrictionsDetails() {
    this.getRestrictionCard().should('contain.text', 'Child Visitors to be Vetted')
    this.checkPrisonerContactRestrictionCardRowTitles()
    this.checkPrisonerContactRestrictionCardRowValues()
    return this
  }

  private checkPrisonerContactRestrictionCardRowTitles() {
    this.getRestrictionCardColumnTitleByRaw(3, 1).should('contain.text', 'Start date')
    this.getRestrictionCardColumnTitleByRaw(3, 2).should('contain.text', 'Expiry date')
    this.getRestrictionCardColumnTitleByRaw(3, 3).should('contain.text', 'Entered by')
    this.getRestrictionCardColumnTitleByRaw(3, 4).should('contain.text', 'Comment')
  }

  private checkPrisonerContactRestrictionCardRowValues() {
    this.getRestrictionCardColumnValueByRaw(3, 1).should('contain.text', '1 January 2024')
    this.getRestrictionCardColumnValueByRaw(3, 2).should('contain.text', '1 August 2050')
    this.getRestrictionCardColumnValueByRaw(3, 3).should('contain.text', 'USER1')
    this.getRestrictionCardColumnValueByRaw(3, 4).should('contain.text', 'Keep an eye')
  }

  checkGlobalRestrictionsDetails() {
    this.getRestrictionCard().should('contain.text', 'Child Visitors to be Vetted')
    this.checkGlobalRestrictionCardRowTitles()
    this.checkGlobalRestrictionCardRowValues()
    return this
  }

  private checkGlobalRestrictionCardRowValues() {
    this.getRestrictionCardColumnValueByRaw(7, 1).should('contain.text', '1 January 2024')
    this.getRestrictionCardColumnValueByRaw(7, 2).should('contain.text', '1 August 2050')
    this.getRestrictionCardColumnValueByRaw(7, 3).should('contain.text', 'USER1')
    this.getRestrictionCardColumnValueByRaw(7, 4).should('contain.text', 'Keep an eye')
  }

  private checkGlobalRestrictionCardRowTitles() {
    this.getRestrictionCardColumnTitleByRaw(7, 1).should('contain.text', 'Start date')
    this.getRestrictionCardColumnTitleByRaw(7, 2).should('contain.text', 'Expiry date')
    this.getRestrictionCardColumnTitleByRaw(7, 3).should('contain.text', 'Entered by')
    this.getRestrictionCardColumnTitleByRaw(7, 4).should('contain.text', 'Comment')
  }

  private getPrisonerContactRestrictionsCardTitle = (): PageElement =>
    cy.get('[data-qa="confirm-prisoner-contact-restriction-title"]')

  private getGlobalRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="confirm-global-restriction-title"]')

  private getRestrictionsTab = (): PageElement => cy.get('#tab_restrictions')

  private getAddPrisonerContactRestriction = (): PageElement =>
    cy.get('[data-qa="add-prisoner-contact-restriction-button"]')

  private getAddGlobalRestriction = (): PageElement => cy.get('[data-qa="add-global-restriction-button"]')

  private getManageGlobalRestriction = (): PageElement => cy.get('[data-qa="manage-CONTACT_GLOBAL-restriction-link-1"]')

  private getManagePrisonerContactRestriction = (): PageElement =>
    cy.get('[data-qa="manage-PRISONER_CONTACT-restriction-link-1"]')

  private getRestrictionCard = (): PageElement =>
    cy.get(
      '[data-qa="restrictions-result-message"] > .govuk-summary-card > .govuk-summary-card__title-wrapper > .govuk-summary-card__title',
    )

  private getRestrictionCardColumnTitleByRaw = (cardNumber: number, columnNumber: number = 4): PageElement =>
    cy.get(this.getGlobalRestrictionTitleByRaw(cardNumber, columnNumber))

  getGlobalRestrictionTitleByRaw = (cardNumber: number, childNumber: number): string =>
    `[data-qa="restrictions-result-message"] > :nth-child(${cardNumber}) > .govuk-summary-card__content > .govuk-summary-list > :nth-child(${childNumber}) > .govuk-summary-list__key`

  private getRestrictionCardColumnValueByRaw = (cardNumber: number, columnNumber: number = 4): PageElement =>
    cy.get(this.getGlobalRestrictionSelector(cardNumber, columnNumber))

  getGlobalRestrictionSelector = (cardNumber: number, childNumber: number): string =>
    `[data-qa="restrictions-result-message"] > :nth-child(${cardNumber}) > .govuk-summary-card__content > .govuk-summary-list > :nth-child(${childNumber}) > .govuk-summary-list__value`

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

  private editNextOfKinContactLink = (): PageElement => cy.get(`[data-qa="change-next-of-kin-link"]`)

  private editRelationshipStatusLink = (): PageElement => cy.get('[data-qa="change-relationship-active-link"]')

  private editRelationshipCommentsLink = (): PageElement => cy.get(`[data-qa="change-relationship-comments-link"]`)

  private viewAllAddressesLink = (): PageElement => cy.get(`[data-qa="view-all-addresses"]`)

  private changeDateOfBirthLink = (id: number): PageElement => cy.get(`[data-qa="change-dob-${id}"]`)

  private changeEstimatedDateOfBirthLink = (id: number): PageElement => cy.get(`[data-qa="change-estimated-dob-${id}"]`)

  private changeNameLink = (): PageElement => cy.get(`[data-qa="change-name-link"]`)

  private changeRelationshipLink = (): PageElement => cy.get(`[data-qa="change-relationship-link"]`)

  private domesticStatusValue = (): PageElement => cy.get('.manage-domestic-status-value')

  private selectDomesticStatusLink = (): PageElement => cy.get('[data-qa="select-domestic-status"]')

  private deletePhoneNumberLink = (id: number): PageElement => cy.get(`[data-qa="delete-phone-number-${id}"]`)

  private deleteEmailLink = (id: number): PageElement => cy.get(`[data-qa="delete-email-address-${id}"]`)

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

  private addEmailLink = (): PageElement => cy.get('[data-qa="add-email-address"]')

  private editEmailLink = (id: number): PageElement => cy.get(`[data-qa="edit-email-address-${id}"]`)

  private mostRelevantAddressLabel = (): PageElement => cy.get(`.most-relevant-address-label`)

  private confirmAddressValue = (): PageElement => cy.get(`.confirm-address-value`)

  verifyShowIsEmergencyContactAs(expected: string) {
    this.checkAnswersEmergencyContactValue().should('contain.text', expected)
  }

  private checkAnswersEmergencyContactValue = (): PageElement => cy.get('.emergency-contact-value')

  verifyShowIsNextOfKinContactAs(expected: string) {
    this.checkAnswersNextOfKinValue().should('contain.text', expected)
  }

  verifyShowIsRelationshipActiveAs(expected: string) {
    this.checkRelationshipStatusValue().should('contain.text', expected)
  }

  private checkAnswersNextOfKinValue = (): PageElement => cy.get('.next-of-kin-value')

  private checkRelationshipStatusValue = (): PageElement => cy.get('.relationship-active-value')

  verifyShowIsRelationshipCommentsAs(expected: string) {
    this.checkAnswersRelationshipCommentsValue().should('contain.text', expected)
  }

  private checkAnswersRelationshipCommentsValue = (): PageElement => cy.get('.relationship-comments-value')
}
