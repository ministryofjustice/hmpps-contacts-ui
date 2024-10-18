import Page, { PageElement } from './page'

export default class SearchPrisonerPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  enterPrisoner(value: string): SearchPrisonerPage {
    this.prisonerSearchFormField().clear().type(value)
    return this
  }

  clickSearchButton(): SearchPrisonerPage {
    this.prisonerSearchSearchButton().click()
    return this
  }

  clickPrisonerLink(prisonerNumber: string): SearchPrisonerPage {
    this.prisonerLink(prisonerNumber).click()
    return this
  }

  verifyShowMessageAsValue(expected: string): SearchPrisonerPage {
    this.noResultMessage().should('contain.text', expected)
    return this
  }

  verifyShowContactsCaptionAsValue(expected: string): SearchPrisonerPage {
    this.manageContactsCaption().should('contain.text', expected)
    return this
  }

  verifyShowContactsHeaderAsValue(expected: string): SearchPrisonerPage {
    this.manageContactH1().should('contain.text', expected)
    return this
  }

  verifyLabelIsVisible(): SearchPrisonerPage {
    this.prisonerSearchFormLabel().should('be.visible')
    return this
  }

  verifySearchFormLabelIsVisible(): SearchPrisonerPage {
    this.prisonerSearchFormLabel().should('be.visible')
    return this
  }

  verifySearchSearchButtonIsVisible(): SearchPrisonerPage {
    this.prisonerSearchSearchButton().should('be.visible')
    return this
  }

  manageContactsCaption = (): PageElement => cy.get('.govuk-caption-l')

  manageContactH1 = (): PageElement => cy.get('.govuk-heading-l')

  prisonerSearchFormLabel = (): PageElement => cy.get('.govuk-label')

  prisonerSearchFormField = (): PageElement => cy.get('#search')

  prisonerSearchSearchButton = (): PageElement => cy.get('[data-test="search"]')

  noResultMessage = (): PageElement => cy.get('[data-qa="no-result-message"]')

  prisonerLink = (prisonerNumber: string): PageElement => cy.get(`[data-qa="prisoner-${prisonerNumber}-name"]`)
}
