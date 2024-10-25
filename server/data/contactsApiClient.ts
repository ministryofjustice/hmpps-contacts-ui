import config from '../config'
import RestClient from './restClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import { components } from '../@types/contactsApi'
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

type Language = components['schemas']['Language']
type PageableObject = components['schemas']['PageableObject']

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
    pagination?: PageableObject,
  ): Promise<PrisonerContactSummaryPage> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.contactsApi.pageSize || 10 }

    return this.get<PrisonerContactSummaryPage>(
      {
        path: `/prisoner/${prisonerNumber}/contact`,
        query: { active: activeOnly, ...paginationParameters },
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

  async getLanguageReference(user: Express.User): Promise<Language> {
    return this.get<Contact>(
      {
        path: `/language-reference`,
      },
      user,
    )
  }

  async getLanguageReferenceById(id: number, user: Express.User): Promise<Language> {
    return this.get<Contact>(
      {
        path: `/language-reference/${id}`,
      },
      user,
    )
  }
}
