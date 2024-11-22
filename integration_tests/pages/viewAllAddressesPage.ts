import Page from './page'

export default class ViewAllAddressesPage extends Page {
  constructor(name: string) {
    super(`Addresses for ${name}`)
  }
}
