import Page, { PageElement } from './page'

export default class DirectSearchContactsPage extends Page {
  constructor() {
    super('Check if the contact is already on the system')
  }

  enterFirstName(value: string): DirectSearchContactsPage {
    this.firstNameTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterMiddleNames(value: string): DirectSearchContactsPage {
    this.middleNamesTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterLastName(value: string): DirectSearchContactsPage {
    this.lastNameTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterDay(value: string): DirectSearchContactsPage {
    this.dayTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterMonth(value: string): DirectSearchContactsPage {
    this.monthTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterYear(value: string): DirectSearchContactsPage {
    this.yearTextBox().clear().type(value, { delay: 0 })
    return this
  }

  enterContactId(value: string): DirectSearchContactsPage {
    this.contactIdBox().clear().type(value, { delay: 0 })
    return this
  }

  clickSearchButton() {
    this.searchButton().click()
  }

  showAdvancedOption() {
    this.showAdvancedOptionElement().click()
  }

  selectSoundsLikeOption() {
    this.searchTypeDropDown().select('Sounds like')
  }

  clickFilterButton() {
    cy.findByRole('button', { name: 'Apply filter' }).click()
  }

  verifyShowsNameAs(expected: string): DirectSearchContactsPage {
    this.checkContactSearchTableNameValue().should('contain.text', expected)
    return this
  }

  verifyShowsDobAs(expected: string): DirectSearchContactsPage {
    this.checkContactSearchTableDobValue().should('contain.text', expected)
    return this
  }

  verifyShowsAddressAs(expected: string): DirectSearchContactsPage {
    const regex = new RegExp(expected.split('<br>').join('<br>\\n?\\s+?'))
    this.checkContactSearchTableAddressValue().then(element => expect(element.html()).match(regex))
    return this
  }

  clickAddNewContactLink() {
    cy.findAllByRole('link', { name: 'add a new contact' }).eq(0).click()
  }

  clickTheContactLink(contactId: number) {
    this.contactLink(contactId).click()
  }

  private firstNameTextBox = (): PageElement => cy.get('#firstName')

  private middleNamesTextBox = (): PageElement => cy.get('#middleNames')

  private lastNameTextBox = (): PageElement => cy.get('#lastName')

  private dayTextBox = (): PageElement => cy.get('#day')

  private monthTextBox = (): PageElement => cy.get('#month')

  private yearTextBox = (): PageElement => cy.get('#year')

  private contactIdBox = (): PageElement => cy.get('#contactId')

  private searchButton = (): PageElement => cy.get('[data-qa=search-button]')

  private searchTypeDropDown = (): PageElement => cy.get('#searchType')

  private showAdvancedOptionElement = (): PageElement => cy.get('.govuk-details__summary-text')

  private contactLink = (contactId: number): PageElement => cy.get(`[data-qa="add-contact-${contactId}-link"]`)

  private checkContactSearchTableNameValue = (): PageElement =>
    cy.get('.govuk-table__body > :nth-child(1) > :nth-child(1)')

  private checkContactSearchTableDobValue = (): PageElement =>
    cy.get('.govuk-table__body > :nth-child(1) > :nth-child(2)')

  private checkContactSearchTableAddressValue = (): PageElement =>
    cy.get('.govuk-table__body > :nth-child(1) > :nth-child(3)')
}
