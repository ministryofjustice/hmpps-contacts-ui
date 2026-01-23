import Page, { PageElement } from './page'

export default class DirectSearchContacts extends Page {
  constructor(prisonerName: string) {
    super(`Contacts linked to ${prisonerName}`)
  }

  clickAddNewContactButton() {
    this.clickButton('Link another contact')
  }

  clickContactNamesLink(name: string): DirectSearchContacts {
    this.clickLink(name)
    return this
  }

  expectNames(expectedNames: string[]): DirectSearchContacts {
    const items = []
    cy.get('.pcl-contact-name-link').each($li => items.push($li.text()))
    cy.wrap(items).should('deep.equal', expectedNames)
    return this
  }

  expectReadOnlyNames(expectedNames: string[]): DirectSearchContacts {
    const items = []
    cy.get('.read-only-contact-name').each($li => items.push($li.text()))
    cy.wrap(items).should('deep.equal', expectedNames)
    return this
  }

  clickSocialContacts(): DirectSearchContacts {
    this.social().check()
    return this
  }

  hasSocialContacts(): DirectSearchContacts {
    this.social().should('be.checked')
    return this
  }

  clickEmergencyContact(): DirectSearchContacts {
    this.emergencyContact().check()
    return this
  }

  hasEmergencyContact(): DirectSearchContacts {
    this.emergencyContact().should('be.checked')
    return this
  }

  clickNextOfKin(): DirectSearchContacts {
    this.nextOfKin().check()
    return this
  }

  hasNextOfKin(): DirectSearchContacts {
    this.nextOfKin().should('be.checked')
    return this
  }

  clickActiveOnly(): DirectSearchContacts {
    this.activeOnly().check()
    return this
  }

  clickViewAllRestrictions(): DirectSearchContacts {
    this.viewAllRestrictionsOnly().click()
    return this
  }

  hasActiveOnly(): DirectSearchContacts {
    this.activeOnly().should('be.checked')
    return this
  }

  private social = (): PageElement => cy.get('#relationshipTypeSocial')

  private emergencyContact = (): PageElement => cy.get('#flagsEmergencyContact')

  private nextOfKin = (): PageElement => cy.get('#flagsNextOfKin')

  private activeOnly = (): PageElement => cy.get(`.govuk-radios__input[value='ACTIVE_ONLY']`)

  private viewAllRestrictionsOnly = (): PageElement => cy.get('[data-qa*="alerts-restrictions"]')
}
