import Page, { PageElement } from '../../page'

export default class EnterAddressPage extends Page {
  constructor(name: string, isEdit: boolean = false) {
    super(isEdit ? `Change this address for ${name}` : `Enter the address for ${name}`)
  }

  verifyCanUsePrisonerAddress(): EnterAddressPage {
    this.usePrisonerAddressButton().should('exist')
    return this
  }

  verifyCanNotUsePrisonerAddress(): EnterAddressPage {
    this.usePrisonerAddressButton().should('not.exist')
    return this
  }

  clickUsePrisonerAddress(): EnterAddressPage {
    this.usePrisonerAddressButton().click()
    return this
  }

  clickNoFixedAddress(): EnterAddressPage {
    this.noFixedAddressCheckbox().click()
    return this
  }

  hasFlat(value: string): EnterAddressPage {
    this.flatTextbox().should('have.value', value)
    return this
  }

  enterFlat(value: string): EnterAddressPage {
    this.clearFlat()
    this.flatTextbox().type(value, { delay: 0 })
    return this
  }

  clearFlat(): EnterAddressPage {
    this.flatTextbox().clear()
    return this
  }

  hasPremises(value: string): EnterAddressPage {
    this.premisesTextbox().should('have.value', value)
    return this
  }

  enterPremises(value: string): EnterAddressPage {
    this.clearPremises()
    this.premisesTextbox().type(value, { delay: 0 })
    return this
  }

  clearPremises(): EnterAddressPage {
    this.premisesTextbox().clear()
    return this
  }

  hasStreet(value: string): EnterAddressPage {
    this.streetTextbox().should('have.value', value)
    return this
  }

  enterStreet(value: string): EnterAddressPage {
    this.clearStreet()
    this.streetTextbox().type(value, { delay: 0 })
    return this
  }

  clearStreet(): EnterAddressPage {
    this.streetTextbox().clear()
    return this
  }

  hasLocality(value: string): EnterAddressPage {
    this.localityTextbox().should('have.value', value)
    return this
  }

  enterLocality(value: string): EnterAddressPage {
    this.clearLocality()
    this.localityTextbox().type(value, { delay: 0 })
    return this
  }

  clearLocality(): EnterAddressPage {
    this.localityTextbox().clear()
    return this
  }

  hasTown(value: string): EnterAddressPage {
    this.townSelect().should('have.value', value)
    return this
  }

  clearTown(): EnterAddressPage {
    this.townSelect().clear()
    return this
  }

  selectTown(value: string): EnterAddressPage {
    this.townSelect().type(value, { delay: 0 })
    return this
  }

  hasCounty(value: string): EnterAddressPage {
    this.countySelect().should('have.value', value)
    return this
  }

  clearCounty(): EnterAddressPage {
    this.countySelect().clear()
    return this
  }

  selectCounty(value: string): EnterAddressPage {
    this.countySelect().type(value, { delay: 0 })
    return this
  }

  hasPostcode(value: string): EnterAddressPage {
    this.postcodeTextbox().should('have.value', value)
    return this
  }

  enterPostcode(value: string): EnterAddressPage {
    this.clearPostcode()
    this.postcodeTextbox().type(value, { delay: 0 })
    return this
  }

  clearPostcode(): EnterAddressPage {
    this.postcodeTextbox().clear()
    return this
  }

  hasCountry(value: string): EnterAddressPage {
    this.countrySelect().should('have.value', value)
    return this
  }

  selectCountry(value: string): EnterAddressPage {
    this.countrySelect().type(value, { delay: 0 })
    return this
  }

  private noFixedAddressCheckbox = (): PageElement => cy.get('#noFixedAddressYes')

  private flatTextbox = (): PageElement => cy.get('#flat')

  private premisesTextbox = (): PageElement => cy.get('#property')

  private streetTextbox = (): PageElement => cy.get('#street')

  private localityTextbox = (): PageElement => cy.get('#area')

  private townSelect = (): PageElement => cy.get('#cityCode')

  private countySelect = (): PageElement => cy.get('#countyCode')

  private postcodeTextbox = (): PageElement => cy.get('#postcode')

  private countrySelect = (): PageElement => cy.get('#countryCode')

  private usePrisonerAddressButton = (): PageElement =>
    cy.findByRole('link', { name: 'Automatically copy the prisoner’s primary address into this page' })
}
