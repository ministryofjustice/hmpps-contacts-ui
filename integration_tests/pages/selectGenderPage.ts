import Page, { PageElement } from './page'

export default class SelectGenderPage extends Page {
  constructor(name: string, isOptional: boolean = false) {
    let title = `What is ${name}’s gender?`
    if (isOptional) {
      title += ' (optional)'
    }
    super(title)
  }

  selectGender(value: 'M' | 'F' | 'NK' | 'NF'): SelectGenderPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'M' | 'F' | 'NK' | 'NF'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
