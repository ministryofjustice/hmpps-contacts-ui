import config from '../config'
import RestClient from './restClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import { components } from '../@types/contactsApi'
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
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult

type Language = components['schemas']['Language']
type PageableObject = components['schemas']['PageableObject']
type CreateEmailRequest = components['schemas']['CreateEmailRequest']
type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']
export default class ContactsApiClient extends RestClient {
  constructor() {
    super('Contacts API client', config.apis.contactsApi)
  }

  async createContact(request: CreateContactRequest, user: Express.User): Promise<ContactCreationResult> {
    return this.post<ContactCreationResult>(
      {
        path: `/contact`,
        data: request,
      },
      user,
    )
  }

  async addContactRelationship(
    request: AddContactRelationshipRequest,
    user: Express.User,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.post<PrisonerContactRelationshipDetails>(
      {
        path: `/prisoner-contact`,
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
    return this.get<PrisonerContactRelationshipDetails>({ path: `/prisoner-contact/${prisonerContactId}` }, user)
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
    prisonerContactId: number,
    request: UpdateRelationshipRequest,
    user: Express.User,
  ): Promise<PatchContactResponse> {
    return this.patch<UpdateRelationshipRequest>(
      {
        path: `/prisoner-contact/${prisonerContactId}`,
        data: request,
      },
      user,
    )
  }

  async createContactEmail(
    contactId: number,
    request: CreateEmailRequest,
    user: Express.User,
  ): Promise<ContactEmailDetails> {
    return this.post<ContactEmailDetails>(
      {
        path: `/contact/${contactId}/email`,
        data: request,
      },
      user,
    )
  }

  async updateContactEmail(
    contactId: number,
    contactEmailId: number,
    request: UpdateEmailRequest,
    user: Express.User,
  ): Promise<ContactEmailDetails> {
    return this.put<ContactEmailDetails>(
      {
        path: `/contact/${contactId}/email/${contactEmailId}`,
        data: request,
      },
      user,
    )
  }

  async deleteContactEmail(contactId: number, contactEmailId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/email/${contactEmailId}`,
      },
      user,
    )
  }
}
