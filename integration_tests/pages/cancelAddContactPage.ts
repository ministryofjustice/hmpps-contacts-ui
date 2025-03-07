import Page from './page'

export default class CancelAddContactPage extends Page {
  constructor(mode: string, name: string) {
    super(
      mode === 'NEW'
        ? `Are you sure you want to cancel adding ${name} as a contact?`
        : 'Are you sure you want to cancel linking the prisoner and the contact?',
    )
  }
}
