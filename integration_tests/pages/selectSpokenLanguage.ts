import Page, { PageElement } from './page'

export default class SelectSpokenLanguagePage extends Page {
  constructor(name: string) {
    super(`What is the spoken language of ${name}?`)
  }

  selectSpokenLanguage(value: string): SelectSpokenLanguagePage {
    this.spokenLanguageSelect().select(value)
    return this
  }

  clickSaveAndContinue(): SelectSpokenLanguagePage {
    this.saveAndContinueButton().click()
    return this
  }

  clickSaveAndCancel(): SelectSpokenLanguagePage {
    this.cancelButton().click()
    return this
  }

  private spokenLanguageSelect = (): PageElement => cy.get('#spoken-language')

  private saveAndContinueButton = (): PageElement => cy.get('[data-qa=save-continue-button]')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}
