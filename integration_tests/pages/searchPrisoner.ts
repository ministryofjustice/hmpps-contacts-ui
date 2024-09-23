import Page, { PageElement } from './page'

export default class SearchPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  manageContactsCaption = (): PageElement => cy.get('.govuk-caption-l')

  manageContactH1 = (): PageElement => cy.get('.govuk-heading-l')

  prisonerSearchFormLabel = (): PageElement => cy.get('.govuk-label')

  prisonerSearchFormField = (): PageElement => cy.get('#search')

  prisonerSearchSearchButton = (): PageElement => cy.get('[data-test="search"]')

  noResultMessage = (): PageElement => cy.get('[data-qa="no-result-message"]')

  clickPrisonerLink = (): PageElement => cy.get('.govuk-table__row > :nth-child(1) > .govuk-link').click()
}
