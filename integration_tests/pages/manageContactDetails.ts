import Page, { PageElement } from './page'

export default class ManageContactDetailsPage extends Page {
  constructor(name: string) {
    super(`Information on linked contact ${name}`)
  }

  clickEditContactDetailsLink() {
    this.editContactDetailsLink().click()
    return this
  }

  clickApproveVisitLink() {
    this.approveVisitLink().click()
    return this
  }

  clickEditContactMethodsLink() {
    this.editContactMethodsLink().click()
    return this
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

  checkGlobalPrisonerRestrictionsCardTitle() {
    this.getGlobalPrisonerRestrictionsCardTitle().should('contain.text', `Global prisoner restrictions`)
    return this
  }

  private getPrisonerContactRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="PRISONER_CONTACT-title"]')

  private getGlobalRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="CONTACT_GLOBAL-title"]')

  private getGlobalPrisonerRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="prisoner-restrictions-title"]')

  private getRestrictionsTab = (): PageElement => cy.get('#tab_restrictions')

  private editContactDetailsLink = (): PageElement => cy.get('[data-qa="edit-contact-details-link"]')

  private approveVisitLink = (): PageElement => cy.get('[data-qa="change-approval-link"]')

  private editContactMethodsLink = (): PageElement => cy.get('[data-qa="edit-contact-methods-link"]')

  private recordDateOfDeathLink = (): PageElement => cy.findByRole('link', { name: 'Record the death of this contact' })

  verifyOnRestrictionsTab(): ManageContactDetailsPage {
    this.restrictionsTabHeading().should('be.visible')
    return this
  }

  verifyOnProfessionalInformationTab() {
    cy.findByRole('heading', { name: 'Professional information' }).should('be.visible')
    return this
  }

  private restrictionsTabHeading = (): PageElement => cy.get('[data-qa="manage-contact-restrictions-title"]')

  private contactMethodsTab = (): PageElement => cy.get('#tab_contact-methods')

  verifyNameChangeDetailsSummaryPresent(): ManageContactDetailsPage {
    cy.findByText('Show previous names').should('be.visible')
    return this
  }

  verifyNoNameChangeHistoryCards(): ManageContactDetailsPage {
    cy.get('[data-qa="name-change-history"]').should('not.exist')
    return this
  }

  verifyLatestNameChangeCard(expected: {
    changedOn: string
    newName: string
    previousName: string
    updatedBy: string
  }): ManageContactDetailsPage {
    cy.get('[data-qa="name-change-history"]').should('exist')
    cy.contains('Latest name change')
      .parent()
      .within(() => {
        cy.contains('Date of name change').next().should('contain.text', expected.changedOn)
        cy.contains('New name').next().should('contain.text', expected.newName)
        cy.contains('Previous name').next().should('contain.text', expected.previousName)
        cy.contains('Name updated by').next().should('contain.text', expected.updatedBy)
      })
    return this
  }

  verifyPreviousNameChangeCard(
    index: number,
    expected: {
      changedOn: string
      newName: string
      previousName: string
      updatedBy: string
    },
  ): ManageContactDetailsPage {
    cy.contains('h2', `Previous name change ${index}`)
      .closest('.govuk-summary-card')
      .within(() => {
        cy.contains('.govuk-summary-list__row', 'Date of name change')
          .find('dd')
          .should('contain.text', expected.changedOn)
        cy.contains('.govuk-summary-list__row', 'New name').find('dd').should('contain.text', expected.newName)
        cy.contains('.govuk-summary-list__row', 'Previous name')
          .find('dd')
          .should('contain.text', expected.previousName)
        cy.contains('.govuk-summary-list__row', 'Name updated by').find('dd').should('contain.text', expected.updatedBy)
      })
    return this
  }

  verifyNameChangeHistoryWarning(featureStart: string): ManageContactDetailsPage {
    cy.get('[data-qa="name-change-history"]').find('.govuk-warning-text__text').should('contain.text', featureStart)
    return this
  }
}
