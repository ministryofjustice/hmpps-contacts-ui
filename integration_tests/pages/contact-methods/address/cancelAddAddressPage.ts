import Page from '../../page'

export default class CancelAddAddressPage extends Page {
  constructor(name: string) {
    super(`Are you sure you want to cancel adding an address for ${name}?`)
  }
}
