import Page, { PageElement } from './page'

export default class SearchPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')
}
