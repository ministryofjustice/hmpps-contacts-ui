import Page, { PageElement } from './page'

export default class ContactConfirmationPage extends Page {
  constructor(name: string) {
    super(`Is this the right person to add as a contact for ${name}?`)
  }

  verifyShowsContactDetailsTabTitleAs(expected: string): ContactConfirmationPage {
    this.contactTab(0).should('contain.text', expected)
    return this
  }

  verifyShowsRestrictionsTabTitleAs(expected: string): ContactConfirmationPage {
    this.contactTab(1).should('contain.text', expected)
    return this
  }

  verifyShowsLinkedOffendersTabTitleAs(expected: string): ContactConfirmationPage {
    this.contactTab(2).should('contain.text', expected)
    return this
  }

  verifyShowsBasicDetailsCardTitleAs(expected: string): ContactConfirmationPage {
    this.contactCard(0).should('contain.text', expected)
    return this
  }

  verifyShowsAddressesCardTitleAs(expected: string): ContactConfirmationPage {
    this.contactCard(1).should('contain.text', expected)
    return this
  }

  verifyShowsPhoneNumbersCardTitleAs(expected: string): ContactConfirmationPage {
    this.contactCard(2).should('contain.text', expected)
    return this
  }

  verifyShowsEmailAddressesCardTitleAs(expected: string): ContactConfirmationPage {
    this.contactCard(3).should('contain.text', expected)
    return this
  }

  verifyShowsIdentityNumbersCardTitleAs(expected: string): ContactConfirmationPage {
    this.contactCard(4).should('contain.text', expected)
    return this
  }

  verifyShowsLanguangeDetailsCardTitleAs(expected: string): ContactConfirmationPage {
    this.contactCard(5).should('contain.text', expected)
    return this
  }

  verifyShowsIsTheRightPersonYesRadioTitleAs(expected: string): ContactConfirmationPage {
    this.radioBox(0).should('contain.text', expected)
    return this
  }

  verifyShowsIsTheRightPersonNoRadioTitleAs(expected: string): ContactConfirmationPage {
    this.radioBox(1).should('contain.text', expected)
    return this
  }

  verifyContinueButtonTitleAs(expected: string): ContactConfirmationPage {
    this.clickContinueButton().should('contain.text', expected)
    return this
  }

  selectIsTheRightPersonYesRadio(): ContactConfirmationPage {
    this.checkRadio(0).check()
    return this
  }

  selectIsTheRightPersonNoRadio(): ContactConfirmationPage {
    this.checkRadio(1).check()
    return this
  }

  verifyShowLastNameAs(expected: string): ContactConfirmationPage {
    this.lastNameValue().should('contain.text', expected)
    return this
  }

  verifyShowMiddleNameAs(expected: string): ContactConfirmationPage {
    this.middleNameValue().should('contain.text', expected)
    return this
  }

  verifyShowDeceasedDateValueAs(expected: string): ContactConfirmationPage {
    this.deceasedDateValue().should('contain.text', expected)
    return this
  }

  private contactTab = (elementNumber: number): PageElement => cy.get(`.govuk-tabs__tab:eq(${elementNumber})`)

  private contactCard = (elementNumber: number): PageElement =>
    cy.get(`.govuk-summary-card:eq(${elementNumber}) .govuk-summary-card__title`)

  private lastNameValue = (): PageElement => cy.get('[data-qa=confirm-name-value]')

  private middleNameValue = (): PageElement => cy.get('[data-qa=confirm-mid-name-value]')

  private deceasedDateValue = (): PageElement => cy.get('[data-qa=confirm-deceased-date-value]')

  private radioBox = (elementNumber: number): PageElement =>
    cy.get(`.govuk-radios .govuk-radios__item:eq(${elementNumber})`)

  private checkRadio = (elementNumber: number): PageElement => cy.get('[type="radio"]').eq(elementNumber)

  private clickContinueButton = (): PageElement => cy.get('[data-qa=continue-button]')
}
