import Page, { PageElement } from '../../page'

export default class SelectAddressFlagsPage extends Page {
  constructor(name: string, isEdit: boolean = false) {
    super(
      isEdit
        ? `Change if this is the primary or postal address for ${name}`
        : `Set this address as the primary or postal address for ${name} (optional)`,
    )
  }

  verifyIsPrimaryOrPostalAnswer(value: 'P' | 'M' | 'PM' | 'NONE' | null) {
    if (value) {
      this.radio(value).should('be.checked')
    } else {
      cy.get('.govuk-radios__input:checked').should('not.exist')
    }
    return this
  }

  selectIsPrimaryOrPostal(value: 'P' | 'M' | 'PM' | 'NONE') {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'P' | 'M' | 'PM' | 'NONE'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
