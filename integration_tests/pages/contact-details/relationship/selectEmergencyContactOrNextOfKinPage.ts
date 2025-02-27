import Page, { PageElement } from '../../page'

export default class SelectEmergencyContactOrNextOfKinPage extends Page {
  constructor(contactName: string, prisonerName: string, isOptional: boolean = false) {
    let title = `Is ${contactName} an emergency contact or next of kin for ${prisonerName}?`
    if (isOptional) {
      title += ' (optional)'
    }
    super(title)
  }

  selectIsEmergencyContactOrNextOfKin(value: 'EC' | 'NOK' | 'ECNOK' | 'NONE'): SelectEmergencyContactOrNextOfKinPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'EC' | 'NOK' | 'ECNOK' | 'NONE'): PageElement =>
    cy.get(`.govuk-radios__input[value='${value}']`)
}
