import Page, { PageElement } from '../../page'

export default class SelectApprovedVisitorPage extends Page {
  constructor(contactName: string, prisonerName: string, isOptional: boolean = false) {
    let title = `Is ${contactName} approved to visit ${prisonerName}?`
    if (isOptional) {
      title += ' (optional)'
    }
    super(title)
  }

  selectIsApprovedVisitor(value: 'YES' | 'NO'): SelectApprovedVisitorPage {
    this.radio(value).click()
    return this
  }

  private radio = (value: 'YES' | 'NO'): PageElement => cy.get(`.govuk-radios__input[value='${value}']`)
}
