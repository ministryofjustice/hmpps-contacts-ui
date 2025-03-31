import Page, { PageElement } from './page'

export default class ContactConfirmationPage extends Page {
  constructor(
    private contactName: string,
    private prisonerName: string,
  ) {
    super(`Check and confirm if you want to link contact ${contactName} to prisoner ${prisonerName}`)
  }

  verifyShowsTabTitleAs(expected: string, index: number): ContactConfirmationPage {
    this.contactTab(index).should('contain.text', expected)
    return this
  }

  verifyShowsCardTitleAs(expected: string, index: number): ContactConfirmationPage {
    this.contactCard(index).should('contain.text', expected)
    return this
  }

  selectIsTheRightPersonYesRadio(): ContactConfirmationPage {
    this.checkRadio(0).check()
    return this
  }

  selectIsTheRightPersonNoSearchAgainRadio(): ContactConfirmationPage {
    this.checkRadio(1).check()
    return this
  }

  selectIsTheRightPersonNoCreateNewRadio(): ContactConfirmationPage {
    this.checkRadio(2).check()
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
    const regex = new RegExp(expected.split('<br>').join('<br>\\n?\\s+?'))
    this.addressValue().then(element => expect(element.html()).match(regex))
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
    this.addressFromToDate().should('contain.text', expected)
    return this
  }

  verifyShowPhoneNumbersValueAs(expected: string, phoneType: string): ContactConfirmationPage {
    this.phoneNumbersValue(phoneType).should('contain.text', expected)
    return this
  }

  verifyShowEmailAddressValueAs(expected: string): ContactConfirmationPage {
    this.emalAddressValue().should('contain.text', expected)
    return this
  }

  verifyShowIdentityNumberValueAs(expected: string, type: string): ContactConfirmationPage {
    this.identityNumberValue(type).should('contain.text', expected)
    return this
  }

  verifyShowSpokenLanguageValueAs(expected: string): ContactConfirmationPage {
    this.spokenLanguageValue().should('contain.text', expected)
    return this
  }

  verifyShowNeedsInterpreterValueAs(expected: string): ContactConfirmationPage {
    this.needsInterpreterValue().should('contain.text', expected)
    return this
  }

  verifyShowGenderValueAs(expected: string): ContactConfirmationPage {
    this.genderValue().should('contain.text', expected)
    return this
  }

  // Not Provided Sections
  verifyShowAddressesValueAsNotProvided(expected: string): ContactConfirmationPage {
    this.addressesNotProvided().should('contain.text', expected)
    return this
  }

  verifyShowAddressesSpecificPhoneNumbersValueAsNotProvided(expected: string): ContactConfirmationPage {
    this.addressesSpecificPhoneNumbersNotProvided().should('contain.text', expected)
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

  clickRestrictionsTab() {
    this.getRestrictionsTab().should('contain.text', 'Restrictions (1)').click()
    return this
  }

  checkRestrictionsDetails() {
    this.getRestrictionCard().should('contain.text', 'Child Visitors to be Vetted')
    return this
  }

  hasLinkedPrisonersCount(count: number): ContactConfirmationPage {
    this.linkedPrisonersTab().should('contain.text', `Linked prisoners (${count})`)
    return this
  }

  clickLinkedPrisonerTab(): ContactConfirmationPage {
    this.linkedPrisonersTab().click()
    return this
  }

  hasLinkedPrisonerRow(rowNumber: number, prisonerNumber: string): ContactConfirmationPage {
    this.linkedPrisonerRow(rowNumber).should('contain.text', prisonerNumber)
    return this
  }

  clickPaginationLink(name: string): ContactConfirmationPage {
    cy.findAllByRole('link', { name }).first().click()
    return Page.verifyOnPage(ContactConfirmationPage, this.contactName, this.prisonerName)
  }

  private getRestrictionsTab = (): PageElement => cy.get('#tab_restrictions')

  private linkedPrisonersTab = (): PageElement => cy.get('#tab_linked-prisoners')

  private linkedPrisonerRow = (rowNumber: number): PageElement =>
    cy.get('.linked-prisoners-table > tbody > tr').eq(rowNumber)

  private getRestrictionCard = (): PageElement => cy.get('[data-qa="restrictions-result-message"]')

  private contactTab = (elementNumber: number): PageElement => cy.get(`.govuk-tabs__tab:eq(${elementNumber})`)

  private contactCard = (elementNumber: number): PageElement =>
    cy.get(`.govuk-summary-card:eq(${elementNumber}) .govuk-summary-card__title`)

  private lastNameValue = (): PageElement => cy.get('.confirm-name-value')

  private dobValue = (): PageElement => cy.get('.confirm-dob-value')

  private deceasedDateValue = (): PageElement => cy.get('.confirm-deceased-date-value')

  private addressValue = (): PageElement => cy.get('.confirm-address-value')

  private addressTypeValue = (): PageElement => cy.get('.confirm-type-value')

  private addressSpecificPhoneValue = (phoneType: string): PageElement =>
    cy.get(`[data-qa=confirm-specific-phone-${phoneType}-value]`)

  private emailValue = (): PageElement => cy.get('.confirm-mail-value')

  private commentsValue = (): PageElement => cy.get('.confirm-comments-value')

  private phoneNumbersValue = (phoneType: string): PageElement => cy.get(`.confirm-${phoneType}-number-value`)

  private emalAddressValue = (): PageElement => cy.get('.confirm-email-addresses-value')

  private identityNumberValue = (type: string): PageElement => cy.get(`.confirm-${type}-value`)

  private spokenLanguageValue = (): PageElement => cy.get('.confirm-spoken-language-value')

  private needsInterpreterValue = (): PageElement => cy.get('.confirm-needs-interpreter-value')

  private checkRadio = (elementNumber: number): PageElement => cy.get('[type="radio"]').eq(elementNumber)

  private addressesNotProvided = (): PageElement => cy.get('.addresses-not-provided')

  private addressesSpecificPhoneNumbersNotProvided = (): PageElement =>
    cy.get(`.address-specific-phone-numbers-not-provided`)

  private phoneNumbersNotProvided = (): PageElement => cy.get('.phone-numbers-not-provided')

  private emailAddressesNotProvided = (): PageElement => cy.get('.email-addresses-not-provided')

  private identityNumbersNotProvided = (): PageElement => cy.get('.identity-numbers-not-provided')

  private addressFromToDate = (): PageElement => cy.get('[data-qa=from-to-date]')

  private genderValue = (): PageElement => cy.get('.confirm-gender-value')
}
