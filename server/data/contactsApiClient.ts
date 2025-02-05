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
import CreateContactRestrictionRequest = contactsApiClientTypes.CreateContactRestrictionRequest
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import CreatePrisonerContactRestrictionRequest = contactsApiClientTypes.CreatePrisonerContactRestrictionRequest
import PrisonerContactRestrictionDetails = contactsApiClientTypes.PrisonerContactRestrictionDetails
import UpdatePrisonerContactRestrictionRequest = contactsApiClientTypes.UpdatePrisonerContactRestrictionRequest
import UpdateContactRestrictionRequest = contactsApiClientTypes.UpdateContactRestrictionRequest
import PrisonerContactRestrictionsResponse = contactsApiClientTypes.PrisonerContactRestrictionsResponse
import CreateContactAddressRequest = contactsApiClientTypes.CreateContactAddressRequest
import ContactAddressDetails = contactsApiClientTypes.ContactAddressDetails
import UpdateContactAddressRequest = contactsApiClientTypes.UpdateContactAddressRequest
import CreateContactAddressPhoneRequest = contactsApiClientTypes.CreateContactAddressPhoneRequest
import ContactAddressPhoneDetails = contactsApiClientTypes.ContactAddressPhoneDetails
import UpdateContactAddressPhoneRequest = contactsApiClientTypes.UpdateContactAddressPhoneRequest
import LinkedPrisonerDetails = contactsApiClientTypes.LinkedPrisonerDetails
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage

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

  async createContactGlobalRestriction(
    contactId: number,
    request: CreateContactRestrictionRequest,
    user: Express.User,
  ): Promise<ContactRestrictionDetails> {
    return this.post<ContactRestrictionDetails>(
      {
        path: `/contact/${contactId}/restriction`,
        data: request,
      },
      user,
    )
  }

  async updateContactGlobalRestriction(
    contactId: number,
    contactRestrictionId: number,
    request: UpdateContactRestrictionRequest,
    user: Express.User,
  ): Promise<ContactRestrictionDetails> {
    return this.put<ContactRestrictionDetails>(
      {
        path: `/contact/${contactId}/restriction/${contactRestrictionId}`,
        data: request,
      },
      user,
    )
  }

  async createPrisonerContactRestriction(
    prisonerContactId: number,
    request: CreatePrisonerContactRestrictionRequest,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionDetails> {
    return this.post<PrisonerContactRestrictionDetails>(
      {
        path: `/prisoner-contact/${prisonerContactId}/restriction`,
        data: request,
      },
      user,
    )
  }

  async updatePrisonerContactRestriction(
    prisonerContactId: number,
    prisonerContactRestrictionId: number,
    request: UpdatePrisonerContactRestrictionRequest,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionDetails> {
    return this.put<PrisonerContactRestrictionDetails>(
      {
        path: `/prisoner-contact/${prisonerContactId}/restriction/${prisonerContactRestrictionId}`,
        data: request,
      },
      user,
    )
  }

  async getGlobalContactRestrictions(contactId: number, user: Express.User): Promise<ContactRestrictionDetails[]> {
    return this.get<ContactRestrictionDetails[]>({ path: `/contact/${contactId}/restriction` }, user)
  }

  async getPrisonerContactRestrictions(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionsResponse> {
    return this.get<PrisonerContactRestrictionsResponse>(
      { path: `/prisoner-contact/${prisonerContactId}/restriction` },
      user,
    )
  }

  async createContactAddress(
    contactId: number,
    request: CreateContactAddressRequest,
    user: Express.User,
  ): Promise<ContactIdentityDetails> {
    return this.post<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address`,
        data: request,
      },
      user,
    )
  }

  async updateContactAddress(
    contactId: number,
    contactAddressId: number,
    request: UpdateContactAddressRequest,
    user: Express.User,
  ): Promise<ContactIdentityDetails> {
    return this.put<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}`,
        data: request,
      },
      user,
    )
  }

  async createContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    request: CreateContactAddressPhoneRequest,
    user: Express.User,
  ): Promise<ContactAddressPhoneDetails> {
    return this.post<ContactAddressPhoneDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phone`,
        data: request,
      },
      user,
    )
  }

  async updateContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactAddressPhoneId: number,
    request: UpdateContactAddressPhoneRequest,
    user: Express.User,
  ): Promise<ContactAddressPhoneDetails> {
    return this.put<ContactAddressPhoneDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phone/${contactAddressPhoneId}`,
        data: request,
      },
      user,
    )
  }

  async deleteContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactAddressPhoneId: number,
    user: Express.User,
  ): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phone/${contactAddressPhoneId}`,
      },
      user,
    )
  }

  async getLinkedPrisoners(contactId: number, user: Express.User): Promise<LinkedPrisonerDetails[]> {
    return this.get<LinkedPrisonerDetails[]>({ path: `/contact/${contactId}/linked-prisoners` }, user)
  }

  async searchOrganisations(
    {
      searchTerm,
      page,
      size,
      sort,
    }: {
      searchTerm: string
      page: number
      size: number
      sort: string[]
    },
    user: Express.User,
  ) {
    const name = encodeURIComponent(searchTerm)
    return this.get<OrganisationSummaryResultItemPage[]>(
      {
        path: `/organisation/search?name=${name}&page=${page}&size=${size}${sort.map(itm => `&sort=${encodeURIComponent(itm)}`).join('')}`,
      },
      user,
    )
  }
}
