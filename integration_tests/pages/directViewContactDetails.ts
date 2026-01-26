import Page, { PageElement } from './page'

export default class DirectViewContactDetails extends Page {
  constructor(name: string) {
    super(`View contact information about ${name}`)
  }

  clickRestrictionsTab(count: string = '1') {
    this.getRestrictionsTab().should('contain.text', `Restrictions (${count})`).click()
    return this
  }

  checkPrisonerContactRestrictionsCardTitle() {
    this.getPrisonerContactRestrictionsCardTitle().should('contain.text', `Relationship restrictions`)
    return this
  }

  checkGlobalRestrictionsCardTitle() {
    this.getGlobalRestrictionsCardTitle().should('contain.text', `Global restrictions`)
    return this
  }

  hasLinkedPrisonersCount(count: number) {
    this.linkedPrisonersTab().should('contain.text', `Linked prisoners (${count})`)
    return this
  }

  hasExitButton() {
    const btn = this.exitButton()
    btn.should('contain.text', `Exit`)
    btn.should('have.attr', 'href').and('include', '/start')
    return this
  }

  private getPrisonerContactRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="PRISONER_CONTACT-title"]')

  private getGlobalRestrictionsCardTitle = (): PageElement => cy.get('[data-qa="CONTACT_GLOBAL-title"]')

  private getRestrictionsTab = (): PageElement => cy.get('#tab_restrictions')

  private linkedPrisonersTab = (): PageElement => cy.get('#tab_linked-prisoners')

  private exitButton = (): PageElement => cy.get('[data-qa="exit-button"]')
}
