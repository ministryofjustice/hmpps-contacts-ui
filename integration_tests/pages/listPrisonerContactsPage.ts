import Page from './page'

export default class ListPrisonerContactsPage extends Page {
  constructor(name: string) {
    super(`Contacts for ${name}`)
  }
}
