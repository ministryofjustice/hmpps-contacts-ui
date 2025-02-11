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

  private addPhoneNumberLink = (): PageElement => cy.findByText('Phone numbers').next().find('a')

  private editPhoneNumberLink = (phoneNumber: string): PageElement =>
    cy.findByText(phoneNumber).next().findByText('Change')

  private deletePhoneNumberLink = (phoneNumber: string): PageElement =>
    cy.findByText(phoneNumber).next().findByText('Delete')
}
