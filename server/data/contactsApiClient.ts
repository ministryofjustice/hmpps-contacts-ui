import config from '../config'
import RestClient from './restClient'
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

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

  async getPrisonerContacts(
    prisonerNumber: string,
    activeOnly: boolean,
    user: Express.User,
  ): Promise<PrisonerContactSummary[]> {
    return this.get<Contact[]>(
      {
        path: `/prisoner/${prisonerNumber}`,
        query: { active: activeOnly },
      },
      user,
    )
  }
}
