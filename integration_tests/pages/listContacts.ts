import Page, { PageElement } from './page'

export default class ListContactsPage extends Page {
  constructor(prisonerName: string, isReadOnly: boolean) {
    super(isReadOnly ? `View contacts linked to ${prisonerName}` : `View and manage contacts linked to ${prisonerName}`)
  }

  clickAddNewContactButton() {
    this.clickButton('Link another contact')
  }

  clickContactNamesLink(name: string): ListContactsPage {
    this.clickLink(name)
    return this
  }

  expectNames(expectedNames: string[]): ListContactsPage {
    const items = []
    cy.get('.pcl-contact-name-link').each($li => items.push($li.text()))
    cy.wrap(items).should('deep.equal', expectedNames)
    return this
  }

  expectReadOnlyNames(expectedNames: string[]): ListContactsPage {
    const items = []
    cy.get('.read-only-contact-name').each($li => items.push($li.text()))
    cy.wrap(items).should('deep.equal', expectedNames)
    return this
  }

  clickSocialContacts(): ListContactsPage {
    this.social().check()
    return this
  }

  hasSocialContacts(): ListContactsPage {
    this.social().should('be.checked')
    return this
  }

  clickOfficialContacts(): ListContactsPage {
    this.official().check()
    return this
  }

  hasOfficialContacts(): ListContactsPage {
    this.official().should('be.checked')
    return this
  }

  clickEmergencyContact(): ListContactsPage {
    this.emergencyContact().check()
    return this
  }

  hasEmergencyContact(): ListContactsPage {
    this.emergencyContact().should('be.checked')
    return this
  }

  clickNextOfKin(): ListContactsPage {
    this.nextOfKin().check()
    return this
  }

  hasNextOfKin(): ListContactsPage {
    this.nextOfKin().should('be.checked')
    return this
  }

  clickActiveOnly(): ListContactsPage {
    this.activeOnly().check()
    return this
  }

  clickIncludeInactive(): ListContactsPage {
    this.includeInactive().check()
    return this
  }

  hasIncludeInactive(): ListContactsPage {
    this.includeInactive().should('be.checked')
    return this
  }

  hasActiveOnly(): ListContactsPage {
    this.activeOnly().should('be.checked')
    return this
  }

  private official = (): PageElement => cy.get('#relationshipTypeOfficial')

  private social = (): PageElement => cy.get('#relationshipTypeSocial')

  private emergencyContact = (): PageElement => cy.get('#flagsEmergencyContact')

  private nextOfKin = (): PageElement => cy.get('#flagsNextOfKin')

  private includeInactive = (): PageElement => cy.get(`.govuk-radios__input[value='ACTIVE_AND_INACTIVE']`)

  private activeOnly = (): PageElement => cy.get(`.govuk-radios__input[value='ACTIVE_ONLY']`)
}
