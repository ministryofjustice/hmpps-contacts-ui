import config from '../config'
import RestClient from './restClient'

export default class ContactsApiClient extends RestClient {
  constructor() {
    super('Contacts API client', config.apis.contactsApi)
  }

  // TODO: API methods here
}
