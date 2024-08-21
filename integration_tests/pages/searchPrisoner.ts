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

  searchResultsTrue = (): PageElement => cy.get('#search-results-true')

  searchResultsNone = (): PageElement => cy.get('#search-results-none')

}
