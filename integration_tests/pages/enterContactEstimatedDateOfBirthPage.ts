import Page, { PageElement } from './page'

export default class EnterContactEstimatedDateOfBirthPage extends Page {
  constructor(name: string) {
    super(`Is ${name} over 18 years old?`)
  }

  isEmptyForm(): EnterContactEstimatedDateOfBirthPage {
    this.radio('YES').should('not.be.checked')
    this.radio('NO').should('not.be.checked')
    this.radio('DO_NOT_KNOW').should('not.be.checked')
    return this
  }

  hasIsOverEighteen(value: 'YES' | 'NO' | 'DO_NOT_KNOW'): EnterContactEstimatedDateOfBirthPage {
    this.radio(value).should('be.checked')
    return this
  }

  selectIsOverEighteen(value: 'YES' | 'NO' | 'DO_NOT_KNOW'): EnterContactEstimatedDateOfBirthPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO' | 'DO_NOT_KNOW'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
