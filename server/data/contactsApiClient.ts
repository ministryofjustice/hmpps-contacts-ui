import config from '../config'
import RestClient from './restClient'
import Contact = contactsApiClientTypes.Contact
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import ReferenceCodeType from '../enumeration/referenceCodeType'
import { PaginationRequest } from './prisonerOffenderSearchTypes'

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
    return this.get<PrisonerContactSummary[]>(
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
    pagination: PaginationRequest,
    user: Express.User,
  ): Promise<Contact> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.prisonerSearchApi.pageSize || 20 }
    return this.get(
      {
        path: `/contact/search`,
        query: {
          lastName: contactSearchRequest.lastName,
          firstName: contactSearchRequest.firstName,
          middleName: contactSearchRequest.middleName,
          dateOfBirth: contactSearchRequest.dateOfBirth,
          ...paginationParameters,
        },
      },
      user,
    )
  }
}
