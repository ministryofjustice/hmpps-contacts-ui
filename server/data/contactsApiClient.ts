import config from '../config'
import RestClient from './restClient'
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest

export default class ContactsApiClient extends RestClient {
  constructor() {
    super('Contacts API client', config.apis.contactsApi)
  }

  async createContact(request: CreateContactRequest, user: Express.User): Promise<Contact> {
    return this.post<Contact>(
      {
        path: `/contact`,
        data: request,
      },
      user,
    )
  }
}
