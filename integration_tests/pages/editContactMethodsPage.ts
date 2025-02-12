import Page, { PageElement } from './page'

export default class EditContactMethodsPage extends Page {
  constructor(name: string) {
    super(`Edit contact methods for ${name}`)
  }

  clickAddPhoneNumberLink() {
    this.addPhoneNumberLink().click()
  }

  clickEditPhoneNumberLink(phoneNumber: string) {
    this.editPhoneNumberLink(phoneNumber).click()
  }

  clickDeletePhoneNumberLink(phoneNumber: string) {
    this.deletePhoneNumberLink(phoneNumber).click()
  }

  clickAddEmailLink() {
    this.addEmailLink().click()
  }

  clickEditEmailLink(emailAddress: string) {
    this.editEmailLink(emailAddress).click()
  }

  clickDeleteEmailLink(emailAddress: string) {
    this.deleteEmailLink(emailAddress).click()
  }

  clickAddAddressLink() {
    this.addAddressLink().click()
  }

  clickChangeAddressLink(contactAddressId: number) {
    this.changeAddressLink(contactAddressId).click()
  }

  clickViewPreviousAddresses(): EditContactMethodsPage {
    this.viewPreviousAddresses().click()
    return this
  }

  clickAddAddressPhoneLink(contactAddressId: number) {
    this.addAddressPhoneLink(contactAddressId).click()
  }

  clickChangeAddressPhoneLink(contactAddressPhoneId: number) {
    this.changeAddressPhoneLink(contactAddressPhoneId).click()
  }

  clickDeleteAddressPhoneLink(contactAddressPhoneId: number) {
    this.deleteAddressPhoneLink(contactAddressPhoneId).click()
  }

  private addPhoneNumberLink = (): PageElement => cy.findByText('Phone numbers').next().find('a')

  private editPhoneNumberLink = (phoneNumber: string): PageElement =>
    cy.findByText(phoneNumber).next().findByText('Change')

  private deletePhoneNumberLink = (phoneNumber: string): PageElement =>
    cy.findByText(phoneNumber).next().findByText('Delete')
  // There are 2 instances of "Email addresses" one in the header of the card and one as the first list label

  private addEmailLink = (): PageElement => cy.findAllByText('Email addresses').first().next().find('a')

  private editEmailLink = (emailAddress: string): PageElement => cy.findByText(emailAddress).next().findByText('Change')

  private deleteEmailLink = (emailAddress: string): PageElement =>
    cy.findByText(emailAddress).next().findByText('Delete')

  private addAddressLink = (): PageElement => cy.findAllByText('Addresses').first().parent().next().find('a')

  private viewPreviousAddresses = (): PageElement => cy.findAllByText('View previous addresses').first()
  // TODO: This is being replaced with individual bounce pages for each field, just use the type link for now

  private changeAddressLink = (contactAddressId: number): PageElement =>
    cy.get(`[data-qa=change-address-type-${contactAddressId}]`)

  private addAddressPhoneLink = (contactAddressId: number): PageElement =>
    cy.get(`[data-qa=add-address-phone-link-${contactAddressId}]`)

  private changeAddressPhoneLink = (contactAddressPhoneId: number): PageElement =>
    cy.get(`[data-qa=change-address-phone-${contactAddressPhoneId}]`)

  private deleteAddressPhoneLink = (contactAddressPhoneId: number): PageElement =>
    cy.get(`[data-qa=delete-address-phone-${contactAddressPhoneId}]`)
}
