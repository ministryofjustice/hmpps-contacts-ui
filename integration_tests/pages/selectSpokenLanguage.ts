import Page, { PageElement } from './page'

export default class SelectSpokenLanguagePage extends Page {
  constructor(name: string) {
    super(`What is the spoken language of ${name}?`)
  }

  selectSpokenLanguage(value: string): SelectSpokenLanguagePage {
    this.spokenLanguageSelect().select(value)
    return this
  }

  clickSaveAndCancel(): SelectSpokenLanguagePage {
    this.cancelButton().click()
    return this
  }

  private spokenLanguageSelect = (): PageElement => cy.get('#languageCode')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}
