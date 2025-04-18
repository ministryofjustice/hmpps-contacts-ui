import Page, { PageElement } from '../../page'

export default class SelectAddressTypePage extends Page {
  constructor(name: string, isEdit: boolean = false) {
    super(
      isEdit
        ? `Change the address type for this address for ${name}`
        : `What type of address are you adding for ${name}?`,
    )
  }

  isEmptyForm(): SelectAddressTypePage {
    this.radio('HOME').should('not.be.checked')
    this.radio('WORK').should('not.be.checked')
    this.radio('BUS').should('not.be.checked')
    this.radio('DO_NOT_KNOW').should('not.be.checked')
    return this
  }

  hasAddressType(value: string): SelectAddressTypePage {
    this.radio(value).should('be.checked')
    return this
  }

  selectAddressType(value: string): SelectAddressTypePage {
    this.radio(value).click()
    return this
  }

  private radio = (value: string): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
