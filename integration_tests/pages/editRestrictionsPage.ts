import Page from './page'

export default class EditRestrictionsPage extends Page {
  constructor(name: string, hasAnyRestrictions: boolean) {
    super(hasAnyRestrictions ? `Add or update restrictions for ${name}` : `Add restrictions for ${name}`)
  }
}
