import Page, { PageElement } from './page'

export default class ManageContactDetailsPage extends Page {
  constructor(name: string) {
    super(`Contact details - ${name}`)
  }

  clickEditContactDetailsLink() {
    this.editContactDetailsLink().click()
    return this
  }

  clickEditContactMethodsLink() {
    this.editContactMethodsLink().click()
    return this
  }

  clickRecordDateOfDeathLink() {
    this.recordDateOfDeathLink().click()
  }

  clickContactMethodsTab() {
    this.contactMethodsTab().click()
    return this
  }

  clickRestrictionsTab(count: string = '1') {
    this.getRestrictionsTab().should('contain.text', `Restrictions (${count})`).click()
    return this
  }

  clickProfessionalInformationTab() {
    cy.findByRole('tab', { name: 'Professional information' }).click()
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

  clickManageGlobalRestriction(id: number = 1) {
    this.getManageGlobalRestriction(id).should('contain.text', `Manage`).click()
    return this
  }

  clickManagePrisonerContactRestriction(id: number = 1) {
    this.getManagePrisonerContactRestriction(id).should('contain.text', `Manage`).click()
    return this
  }

  clickEditEmployers() {
    cy.findByRole('link', { name: 'Edit employers' }).click()
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
    this.getRestrictionCardColumnValueByRaw(3, 3).should('contain.text', 'User One')
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
    this.getRestrictionCardColumnValueByRaw(7, 3).should('contain.text', 'User One')
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

  private editContactDetailsLink = (): PageElement => cy.get('[data-qa="edit-contact-details-link"]')

  private editContactMethodsLink = (): PageElement => cy.get('[data-qa="edit-contact-methods-link"]')

  private recordDateOfDeathLink = (): PageElement => cy.findByRole('link', { name: 'Record the death of this contact' })

  private getAddPrisonerContactRestriction = (): PageElement =>
    cy.get('[data-qa="add-prisoner-contact-restriction-button"]')

  private getAddGlobalRestriction = (): PageElement => cy.get('[data-qa="add-global-restriction-button"]')

  private getManageGlobalRestriction = (id: number): PageElement =>
    cy.get(`[data-qa="manage-CONTACT_GLOBAL-restriction-link-${id}"]`)

  private getManagePrisonerContactRestriction = (id: number): PageElement =>
    cy.get(`[data-qa="manage-PRISONER_CONTACT-restriction-link-${id}"]`)

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

  verifyOnRestrictionsTab(): ManageContactDetailsPage {
    this.restrictionsTabHeading().should('be.visible')
    return this
  }

  verifyOnContactsMethodsTab(): ManageContactDetailsPage {
    this.contactMethodsTabHeading().should('be.visible')
    return this
  }

  verifyOnProfessionalInformationTab() {
    cy.findByRole('heading', { name: 'Professional information' }).should('be.visible')
    return this
  }

  private mostRelevantAddressLabel = (): PageElement => cy.get(`.most-relevant-address-label`)

  private confirmAddressValue = (): PageElement => cy.get(`.confirm-address-value`)

  private restrictionsTabHeading = (): PageElement => cy.get('[data-qa="manage-restriction-title"]')

  private contactMethodsTab = (): PageElement => cy.get('#tab_contact-methods')

  private contactMethodsTabHeading = (): PageElement => cy.get('[data-qa="contact-methods-tab-title"]')
}
