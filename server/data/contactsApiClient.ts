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
import ContactDetails = contactsApiClientTypes.ContactDetails
import CreatePhoneRequest = contactsApiClientTypes.CreatePhoneRequest
import ContactPhoneDetails = contactsApiClientTypes.ContactPhoneDetails
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import PatchContactResponse = contactsApiClientTypes.PatchContactResponse
import UpdatePhoneRequest = contactsApiClientTypes.UpdatePhoneRequest
import CreateIdentityRequest = contactsApiClientTypes.CreateIdentityRequest
import UpdateIdentityRequest = contactsApiClientTypes.UpdateIdentityRequest
import ContactIdentityDetails = contactsApiClientTypes.ContactIdentityDetails
import UpdateRelationshipRequest = contactsApiClientTypes.UpdateRelationshipRequest
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails

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

  async getContact(contactId: number, user: Express.User): Promise<ContactDetails> {
    return this.get<ContactDetails>({ path: `/contact/${contactId}` }, user)
  }

  async getPrisonerContactRelationship(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.get<PrisonerContactRelationshipDetails>(
      { path: `/prisoner-contact/relationship/${prisonerContactId}` },
      user,
    )
  }

  async createContactPhone(
    contactId: number,
    request: CreatePhoneRequest,
    user: Express.User,
  ): Promise<ContactPhoneDetails> {
    return this.post<ContactPhoneDetails>(
      {
        path: `/contact/${contactId}/phone`,
        data: request,
      },
      user,
    )
  }

  async updateContactPhone(
    contactId: number,
    contactPhoneId: number,
    request: UpdatePhoneRequest,
    user: Express.User,
  ): Promise<ContactPhoneDetails> {
    return this.put<ContactPhoneDetails>(
      {
        path: `/contact/${contactId}/phone/${contactPhoneId}`,
        data: request,
      },
      user,
    )
  }

  async deleteContactPhone(contactId: number, contactPhoneId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/phone/${contactPhoneId}`,
      },
      user,
    )
  }

  async createContactIdentity(
    contactId: number,
    request: CreateIdentityRequest,
    user: Express.User,
  ): Promise<ContactIdentityDetails> {
    return this.post<ContactIdentityDetails>(
      {
        path: `/contact/${contactId}/identity`,
        data: request,
      },
      user,
    )
  }

  async updateContactIdentity(
    contactId: number,
    contactIdentityId: number,
    request: UpdateIdentityRequest,
    user: Express.User,
  ): Promise<ContactIdentityDetails> {
    return this.put<ContactIdentityDetails>(
      {
        path: `/contact/${contactId}/identity/${contactIdentityId}`,
        data: request,
      },
      user,
    )
  }

  async deleteContactIdentity(contactId: number, contactIdentityId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/identity/${contactIdentityId}`,
      },
      user,
    )
  }

  async getLanguageReference(user: Express.User): Promise<Language> {
    return this.get<Language>(
      {
        path: `/language-reference`,
      },
      user,
    )
  }

  async updateContactById(
    contactId: number,
    request: PatchContactRequest,
    user: Express.User,
  ): Promise<PatchContactResponse> {
    return this.patch<PatchContactRequest>(
      {
        path: `/contact/${contactId}`,
        data: request,
      },
      user,
    )
  }

  async updateContactRelationshipById(
    contactId: number,
    prisonerContactId: number,
    request: UpdateRelationshipRequest,
    user: Express.User,
  ): Promise<PatchContactResponse> {
    return this.patch<UpdateRelationshipRequest>(
      {
        path: `/contact/${contactId}/relationship/${prisonerContactId}`,
        data: request,
      },
      user,
    )
  }
}
