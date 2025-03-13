import Page from './page'

export default class AddContactAdditionalInfoPage extends Page {
  constructor(name: string) {
    super(`Enter additional information about ${name} (optional)`)
  }
}
