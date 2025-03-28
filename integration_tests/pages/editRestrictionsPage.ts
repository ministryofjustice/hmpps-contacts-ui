import Page from './page'

export default class EditRestrictionsPage extends Page {
  constructor(name: string) {
    super(`Add or update restrictions for ${name}`)
  }
}
