import Page, { PageElement } from './page'

export default class ContactMatchPage extends Page {
  constructor(
    private contactName: string,
    private prisonerName: string,
  ) {
    super(`Check and confirm if you want to link contact ${contactName} to prisoner ${prisonerName}`)
  }

  verifyShowsTabTitleAs(expected: string, index: number): ContactMatchPage {
    this.contactTab(index).should('contain.text', expected)
    return this
  }

  selectIsTheRightPersonYesRadio(): ContactMatchPage {
    this.checkRadio(0).check()
    return this
  }

  selectIsTheRightPersonNoSearchAgainRadio(): ContactMatchPage {
    this.checkRadio(1).check()
    return this
  }

  selectIsTheRightPersonNoCreateNewRadio(): ContactMatchPage {
    this.checkRadio(2).check()
    return this
  }

  clickRestrictionsTab() {
    this.getRestrictionsTab().should('contain.text', 'Restrictions (1)').click()
    return this
  }

  checkRestrictionsDetails() {
    this.getRestrictionCard().should('contain.text', 'Child Visitors to be Vetted')
    return this
  }

  hasLinkedPrisonersCount(count: number): ContactMatchPage {
    this.linkedPrisonersTab().should('contain.text', `Linked prisoners (${count})`)
    return this
  }

  clickLinkedPrisonerTab(): ContactMatchPage {
    this.linkedPrisonersTab().click()
    return this
  }

  hasLinkedPrisonerRow(rowNumber: number, prisonerNumber: string): ContactMatchPage {
    this.linkedPrisonerRow(rowNumber).should('contain.text', prisonerNumber)
    return this
  }

  clickPaginationLink(name: string): ContactMatchPage {
    cy.findAllByRole('link', { name }).first().click()
    return Page.verifyOnPage(ContactMatchPage, this.contactName, this.prisonerName)
  }

  private getRestrictionsTab = (): PageElement => cy.get('#tab_restrictions')

  private linkedPrisonersTab = (): PageElement => cy.get('#tab_linked-prisoners')

  private linkedPrisonerRow = (rowNumber: number): PageElement =>
    cy.get('.linked-prisoners-table > tbody > tr').eq(rowNumber)

  private getRestrictionCard = (): PageElement => cy.get('[data-qa="restrictions-result-message"]')

  private contactTab = (elementNumber: number): PageElement => cy.get(`.govuk-tabs__tab:eq(${elementNumber})`)

  private checkRadio = (elementNumber: number): PageElement => cy.get('[type="radio"]').eq(elementNumber)
}
