import Page from './page'

export default class CreateContactAddressesPage extends Page {
  constructor(name: string) {
    super(`Add addresses for ${name} (optional)`)
  }

  clickDeleteAddressLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Delete address/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickChangeTypeLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Change the address type/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickChangeAddressLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Change the address \([A-z\s]+?\)$/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickChangeDatesLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Change the dates for the prisoner’s use of the address/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickChangeFlagsLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Change if this address is set as the primary or postal address for the contact/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickChangeCommentsLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Change the comments on this address/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickAddAddressPhoneLinkTo<T>(constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findByRole('link', {
      name: /(Add another phone number)|(Change the information about the phone number for this address)/,
    }).click()
    return new constructor(...args)
  }

  clickChangeAddressPhoneLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Change the information about the [A-z\s]+? phone number for this address/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }

  clickDeleteAddressPhoneLinkTo<T>(index: number, constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    cy.findAllByRole('link', { name: /Delete the information about the [A-z\s]+? phone number for this address/ })
      .eq(index)
      .click()
    return new constructor(...args)
  }
}
