import Page, { PageElement } from './page'

export default class ManageContactDetailsPage extends Page {
  constructor(name: string) {
    super(`Information on linked contact ${name}`)
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

  clickChangeGlobalRestriction(id: number = 1) {
    this.getChangeGlobalRestriction(id).should('contain.text', `Change`).click()
    return this
  }

  clickChangePrisonerContactRestriction(id: number = 1) {
    this.getChangePrisonerContactRestriction(id).should('contain.text', `Change`).click()
    return this
  }

  clickEditEmployers() {
    cy.findByRole('link', { name: 'Edit employers' }).click()
  }

  checkPrisonerContactRestrictionsCardTitle() {
    this.getPrisonerContactRestrictionsCardTitle().should('contain.text', `Relationship restrictions`)
    return this
  }

  checkGlobalRestrictionsCardTitle() {
    this.getGlobalRestrictionsCardTitle().should('contain.text', `Global restrictions`)
    return this
  }

  private getPrisonerContactRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="PRISONER_CONTACT-title"]')

  private getGlobalRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="CONTACT_GLOBAL-title"]')

  private getRestrictionsTab = (): PageElement => cy.get('#tab_restrictions')

  private editContactDetailsLink = (): PageElement => cy.get('[data-qa="edit-contact-details-link"]')

  private editContactMethodsLink = (): PageElement => cy.get('[data-qa="edit-contact-methods-link"]')

  private recordDateOfDeathLink = (): PageElement => cy.findByRole('link', { name: 'Record the death of this contact' })

  private getAddPrisonerContactRestriction = (): PageElement =>
    cy.get('[data-qa="add-prisoner-contact-restriction-button"]')

  private getAddGlobalRestriction = (): PageElement => cy.get('[data-qa="add-global-restriction-button"]')

  private getChangeGlobalRestriction = (id: number): PageElement =>
    cy.get(`[data-qa="manage-CONTACT_GLOBAL-restriction-link-${id}"]`)

  private getChangePrisonerContactRestriction = (id: number): PageElement =>
    cy.get(`[data-qa="manage-PRISONER_CONTACT-restriction-link-${id}"]`)

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

  private restrictionsTabHeading = (): PageElement => cy.get('[data-qa="manage-contact-restrictions-title"]')

  private contactMethodsTab = (): PageElement => cy.get('#tab_contact-methods')

  private contactMethodsTabHeading = (): PageElement => cy.get('[data-qa="contact-methods-tab-title"]')
}
