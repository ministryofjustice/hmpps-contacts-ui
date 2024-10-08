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

  verifyShowNamesValueAs(expected: string): ContactConfirmationPage {
    this.lastNameValue().should('contain.text', expected)
    return this
  }

  verifyShowDOBValueAs(expected: string): ContactConfirmationPage {
    this.dobValue().should('contain.text', expected)
    return this
  }

  verifyShowDeceasedDateValueAs(expected: string): ContactConfirmationPage {
    this.deceasedDateValue().should('contain.text', expected)
    return this
  }

  verifyShowAddressValueAs(expected: string): ContactConfirmationPage {
    this.addressValue().should('contain.text', expected)
    return this
  }

  verifyShowAddressTypeValueAs(expected: string): ContactConfirmationPage {
    this.addressTypeValue().should('contain.text', expected)
    return this
  }

  verifyShowAddressSpecificPhoneValueAs(expected: string, phoneType: string): ContactConfirmationPage {
    this.addressSpecificPhoneValue(phoneType).should('contain.text', expected)
    return this
  }

  verifyShowEmailValueAs(expected: string): ContactConfirmationPage {
    this.emailValue().should('contain.text', expected)
    return this
  }

  verifyShowCommentsValueAs(expected: string): ContactConfirmationPage {
    this.commentsValue().should('contain.text', expected)
    return this
  }

  verifyShowFromStartDateValueAs(expected: string): ContactConfirmationPage {
    this.fromStartDateValue().should('contain.text', expected)
    return this
  }

  verifyShowPhoneNumbersValueAs(expected: string, phoneType: string): ContactConfirmationPage {
    this.phoneNumbersValue(phoneType).should('contain.text', expected)
    return this
  }

  verifyShowEmalAddressValueAs(expected: string): ContactConfirmationPage {
    this.emalAddressValue().should('contain.text', expected)
    return this
  }

  verifyShowPassportNumberValueAs(expected: string): ContactConfirmationPage {
    this.passportNumberValue().should('contain.text', expected)
    return this
  }

  verifyShowIdentityNumberValueAs(expected: string, type: string): ContactConfirmationPage {
    this.identityNumberValue(type).should('contain.text', expected)
    return this
  }

  verifyShowNeedsInterpreterValueAs(expected: string): ContactConfirmationPage {
    this.needsInterpreterValue().should('contain.text', expected)
    return this
  }

  // Not Provided Sections
  verifyShowAddressesValueAsNotProvided(expected: string): ContactConfirmationPage {
    this.phoneAddressesNotProvided().should('contain.text', expected)
    return this
  }

  verifyShowPhoneNumbersValueAsNotProvided(expected: string): ContactConfirmationPage {
    this.phoneNumbersNotProvided().should('contain.text', expected)
    return this
  }

  verifyShowEmailAddressesValueAsNotProvided(expected: string): ContactConfirmationPage {
    this.emailAddressesNotProvided().should('contain.text', expected)
    return this
  }

  verifyShowIdentitiesValueAsNotProvided(expected: string): ContactConfirmationPage {
    this.identityNumbersNotProvided().should('contain.text', expected)
    return this
  }

  private contactTab = (elementNumber: number): PageElement => cy.get(`.govuk-tabs__tab:eq(${elementNumber})`)

  private contactCard = (elementNumber: number): PageElement =>
    cy.get(`.govuk-summary-card:eq(${elementNumber}) .govuk-summary-card__title`)

  private lastNameValue = (): PageElement => cy.get('[data-qa=confirm-name-value]')

  private dobValue = (): PageElement => cy.get('[data-qa=confirm-dob-value]')

  private deceasedDateValue = (): PageElement => cy.get('[data-qa=confirm-deceased-date-value]')

  private addressValue = (): PageElement => cy.get('[data-qa=confirm-address-value]')

  private addressTypeValue = (): PageElement => cy.get('[data-qa=confirm-type-value]')

  private addressSpecificPhoneValue = (phoneType: string): PageElement =>
    cy.get(`[data-qa=confirm-specific-phone-${phoneType}-value]`)

  private emailValue = (): PageElement => cy.get('[data-qa=confirm-mail-value]')

  private commentsValue = (): PageElement => cy.get('[data-qa=confirm-comments-value]')

  private fromStartDateValue = (): PageElement => cy.get('[data-qa=confirm-start-date-value]')

  private phoneNumbersValue = (phoneType: string): PageElement => cy.get(`[data-qa=confirm-${phoneType}-number-value]`)

  private emalAddressValue = (): PageElement => cy.get('[data-qa=confirm-email-addresses-value]')

  private passportNumberValue = (): PageElement => cy.get('[data-qa=confirm-passport-number-value]')

  private identityNumberValue = (type: string): PageElement => cy.get(`[data-qa=confirm-${type}-value]`)

  private needsInterpreterValue = (): PageElement => cy.get('[data-qa=confirm-needs-interpreter-value]')

  private radioBox = (elementNumber: number): PageElement =>
    cy.get(`.govuk-radios .govuk-radios__item:eq(${elementNumber})`)

  private checkRadio = (elementNumber: number): PageElement => cy.get('[type="radio"]').eq(elementNumber)

  private clickContinueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private phoneAddressesNotProvided = (): PageElement => cy.get(`[data-qa=addresses-not-provided]`)

  private phoneNumbersNotProvided = (): PageElement => cy.get(`[data-qa=phone-numbers-not-provided]`)

  private emailAddressesNotProvided = (): PageElement => cy.get(`[data-qa=email-addresses-not-provided]`)

  private identityNumbersNotProvided = (): PageElement => cy.get(`[data-qa=identity-numbers-not-provided]`)
}
