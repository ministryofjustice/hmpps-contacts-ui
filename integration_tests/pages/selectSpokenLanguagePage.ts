import Page, { PageElement } from './page'

export default class SelectSpokenLanguagePage extends Page {
  constructor(name: string) {
    super(`What is the spoken language of ${name}?`)
  }

  selectSpokenLanguage(value: string): SelectSpokenLanguagePage {
    this.spokenLanguageSelect().select(value)
    return this
  }

  private spokenLanguageSelect = (): PageElement => cy.get('#languageCode')
}
