import Page, { PageElement } from './page'

export default class ContactConfirmationPage extends Page {
  constructor() {
    super('Is this the right person to add as a contact for Smith, John?')
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

  clickTheContinueButton() {
    this.clickContinueButton().click()
  }

  private contactTab = (elementNumber: number): PageElement => cy.get(`.govuk-tabs__tab:eq(${elementNumber})`)

  private contactCard = (elementNumber: number): PageElement =>
    cy.get(`.govuk-summary-card:eq(${elementNumber}) .govuk-summary-card__title`)

  private radioBox = (elementNumber: number): PageElement =>
    cy.get(`.govuk-radios .govuk-radios__item:eq(${elementNumber})`)

  private checkRadio = (elementNumber: number): PageElement => cy.get('[type="radio"]').eq(elementNumber)

  private clickContinueButton = (): PageElement => cy.get('[data-qa=continue-button]')
}
