import config from '../config'
import RestClient from './restClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import Pageable = contactsApiClientTypes.Pageable
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import AddContactRelationshipRequest = contactsApiClientTypes.AddContactRelationshipRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import PrisonerContactSummaryPage = contactsApiClientTypes.PrisonerContactSummaryPage
import GetContactResponse = contactsApiClientTypes.GetContactResponse

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

  async addContactRelationship(
    contactId: number,
    request: AddContactRelationshipRequest,
    user: Express.User,
  ): Promise<void> {
    return this.post(
      {
        path: `/contact/${contactId}/relationship`,
        data: request,
      },
      user,
    )
  }

  async getPrisonerContacts(
    prisonerNumber: string,
    activeOnly: boolean,
    user: Express.User,
  ): Promise<PrisonerContactSummaryPage> {
    return this.get<PrisonerContactSummaryPage>(
      {
        path: `/prisoner/${prisonerNumber}/contact`,
        query: { active: activeOnly },
      },
      user,
    )
  }

  async getReferenceCodes(type: ReferenceCodeType, user: Express.User): Promise<ReferenceCode[]> {
    return this.get<PrisonerContactSummary[]>(
      {
        path: `/reference-codes/group/${type}`,
      },
      user,
    )
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    user: Express.User,
    pagination?: Pageable,
  ): Promise<ContactSearchResultItemPage> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.contactsApi.pageSize || 10 }
    return this.get(
      {
        path: `/contact/search`,
        query: {
          lastName: contactSearchRequest.lastName,
          firstName: contactSearchRequest.firstName,
          middleNames: contactSearchRequest.middleNames,
          dateOfBirth: contactSearchRequest.dateOfBirth,
          ...paginationParameters,
        },
      },
      user,
    )
  }

  async getContact(contactId: number, user: Express.User): Promise<GetContactResponse> {
    return this.get<GetContactResponse>({ path: `/contact/${contactId}` }, user)
  }
}
