import Page, { PageElement } from './page'

export default class EditContactConfirmPage extends Page {
  constructor(numLinkedPrisoners: number, contactName: string) {
    super(`${numLinkedPrisoners} prisoners are linked to ${contactName}. Are you sure you want to edit this contact?`)
  }

  selectConfirmContactEdit(value: 'YES' | 'NO'): EditContactConfirmPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`input[value='${value}']`)
}
