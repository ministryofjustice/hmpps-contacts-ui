import { RestClient, asSystem, type AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import {
  AddContactRelationshipRequest,
  ContactAddressDetails,
  ContactAddressPhoneDetails,
  ContactAuditEntry,
  ContactCreationResult,
  ContactDetails,
  ContactEmailDetails,
  ContactIdentityDetails,
  ContactNameDetails,
  ContactPhoneDetails,
  ContactRestrictionDetails,
  ContactSearchRequest,
  CreateContactAddressRequest,
  CreateContactRequest,
  CreateContactRestrictionRequest,
  CreateIdentityRequest,
  CreateMultipleEmailsRequest,
  CreateMultiplePhoneNumbersRequest,
  CreatePrisonerContactRestrictionRequest,
  PagedModelContactSearchResultItem,
  PagedModelLinkedPrisonerDetails,
  PagedModelPrisonerContactSummary,
  PagedModelPrisonerRestrictionDetails,
  PatchContactAddressRequest,
  PatchContactRequest,
  PatchContactResponse,
  PatchEmploymentsRequest,
  PatchRelationshipRequest,
  PrisonerContactFilter,
  PrisonerContactPagination,
  PrisonerContactRelationshipDetails,
  PrisonerContactRestrictionDetails,
  PrisonerContactRestrictionsResponse,
  PrisonerContactSummary,
  ReferenceCode,
  RelationshipDeletePlan,
  UpdateContactAddressPhoneRequest,
  UpdateContactRestrictionRequest,
  UpdateEmailRequest,
  UpdateIdentityRequest,
  UpdatePhoneRequest,
  UpdatePrisonerContactRestrictionRequest,
} from '../@types/contactsApiClient'

export type Pagination = {
  page: number
  size: number
  sort?: string | string[]
}

export default class ContactsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Contacts API client', config.apis.contactsApi, logger, authenticationClient)
  }

  async createContact(request: CreateContactRequest, user: Express.User): Promise<ContactCreationResult> {
    return this.post<ContactCreationResult>(
      {
        path: `/contact`,
        data: request,
      },
      asSystem(user.username),
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
      asSystem(user.username),
    )
  }

  async filterPrisonerContacts(
    prisonerNumber: string,
    filter: PrisonerContactFilter,
    pagination: PrisonerContactPagination,
    user: Express.User,
  ): Promise<PagedModelPrisonerContactSummary> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.contactsApi.pageSize || 10 }
    return this.get<PagedModelPrisonerContactSummary>(
      {
        path: `/prisoner/${prisonerNumber}/contact`,
        query: { ...paginationParameters, ...filter },
      },
      asSystem(user.username),
    )
  }

  async getAllSummariesForPrisonerAndContact(
    prisonerNumber: string,
    contactId: number,
    user: Express.User,
  ): Promise<PrisonerContactSummary[]> {
    return this.get<PrisonerContactSummary[]>(
      {
        path: `/prisoner/${prisonerNumber}/contact/${contactId}`,
      },
      asSystem(user.username),
    )
  }

  async getReferenceCodes(type: ReferenceCodeType, user: Express.User): Promise<ReferenceCode[]> {
    return this.get<ReferenceCode[]>(
      {
        path: `/reference-codes/group/${type}`,
      },
      asSystem(user.username),
    )
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    user: Express.User,
    pagination?: Pagination,
  ): Promise<PagedModelContactSearchResultItem> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.contactsApi.pageSize || 10 }
    logger.debug(
      `ContactsApiClient searchContactV2 called with request: ${JSON.stringify(contactSearchRequest)} and pagination: ${JSON.stringify(paginationParameters)}`,
    )
    return this.get(
      {
        path: `/contact/search`,
        query: {
          lastName: contactSearchRequest.lastName,
          firstName: contactSearchRequest.firstName,
          middleNames: contactSearchRequest.middleNames,
          dateOfBirth: contactSearchRequest.dateOfBirth,
          includePrisonerRelationships: contactSearchRequest.includePrisonerRelationships,
          searchType: contactSearchRequest.searchType,
          previousNames: contactSearchRequest.previousNames,
          contactId: contactSearchRequest.contactId,
          ...paginationParameters,
        },
      },
      asSystem(user.username),
    )
  }

  async getContact(contactId: number, user: Express.User): Promise<ContactDetails> {
    return this.get<ContactDetails>({ path: `/contact/${contactId}` }, asSystem(user.username))
  }

  async getContactHistory(contactId: number, user: Express.User): Promise<ContactAuditEntry[]> {
    return this.get<ContactAuditEntry[]>({ path: `/contact/${contactId}/history` }, asSystem(user.username))
  }

  async getContactName(contactId: number, user: Express.User): Promise<ContactNameDetails> {
    return this.get<ContactNameDetails>({ path: `/contact/${contactId}/name` }, asSystem(user.username))
  }

  async getPrisonerContactRelationship(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.get<PrisonerContactRelationshipDetails>(
      { path: `/prisoner-contact/${prisonerContactId}` },
      asSystem(user.username),
    )
  }

  async createContactPhones(
    contactId: number,
    request: CreateMultiplePhoneNumbersRequest,
    user: Express.User,
  ): Promise<ContactPhoneDetails[]> {
    return this.post<ContactPhoneDetails[]>(
      {
        path: `/contact/${contactId}/phones`,
        data: request,
      },
      asSystem(user.username),
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
      asSystem(user.username),
    )
  }

  async deleteContactPhone(contactId: number, contactPhoneId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/phone/${contactPhoneId}`,
      },
      asSystem(user.username),
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
      asSystem(user.username),
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
      asSystem(user.username),
    )
  }

  async deleteContactIdentity(contactId: number, contactIdentityId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/identity/${contactIdentityId}`,
      },
      asSystem(user.username),
    )
  }

  async updateContactById(
    contactId: number,
    request: PatchContactRequest,
    user: Express.User,
  ): Promise<PatchContactResponse> {
    return this.patch<PatchContactResponse>(
      {
        path: `/contact/${contactId}`,
        data: request,
      },
      asSystem(user.username),
    )
  }

  async updateContactRelationshipById(
    prisonerContactId: number,
    request: PatchRelationshipRequest,
    user: Express.User,
  ): Promise<void> {
    return this.patch(
      {
        path: `/prisoner-contact/${prisonerContactId}`,
        data: request,
      },
      asSystem(user.username),
    )
  }

  async createContactEmails(
    contactId: number,
    request: CreateMultipleEmailsRequest,
    user: Express.User,
  ): Promise<ContactEmailDetails[]> {
    return this.post<ContactEmailDetails[]>(
      {
        path: `/contact/${contactId}/emails`,
        data: request,
      },
      asSystem(user.username),
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
      asSystem(user.username),
    )
  }

  async deleteContactEmail(contactId: number, contactEmailId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/email/${contactEmailId}`,
      },
      asSystem(user.username),
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
      asSystem(user.username),
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
      asSystem(user.username),
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
      asSystem(user.username),
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
      asSystem(user.username),
    )
  }

  async getGlobalContactRestrictions(contactId: number, user: Express.User): Promise<ContactRestrictionDetails[]> {
    return this.get<ContactRestrictionDetails[]>({ path: `/contact/${contactId}/restriction` }, asSystem(user.username))
  }

  async getPrisonerContactRestrictions(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionsResponse> {
    return this.get<PrisonerContactRestrictionsResponse>(
      { path: `/prisoner-contact/${prisonerContactId}/restriction` },
      asSystem(user.username),
    )
  }

  async createContactAddress(
    contactId: number,
    request: CreateContactAddressRequest,
    user: Express.User,
  ): Promise<ContactAddressDetails> {
    return this.post<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address`,
        data: request,
      },
      asSystem(user.username),
    )
  }

  async updateContactAddress(
    contactId: number,
    contactAddressId: number,
    request: PatchContactAddressRequest,
    user: Express.User,
  ): Promise<ContactAddressDetails> {
    return this.patch<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}`,
        data: request,
      },
      asSystem(user.username),
    )
  }

  async createContactAddressPhones(
    contactId: number,
    contactAddressId: number,
    request: CreateMultiplePhoneNumbersRequest,
    user: Express.User,
  ): Promise<ContactAddressPhoneDetails[]> {
    return this.post<ContactAddressPhoneDetails[]>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phones`,
        data: request,
      },
      asSystem(user.username),
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
      asSystem(user.username),
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
      asSystem(user.username),
    )
  }

  async getLinkedPrisoners(
    contactId: number,
    page: number,
    size: number,
    user: Express.User,
  ): Promise<PagedModelLinkedPrisonerDetails> {
    return this.get<PagedModelLinkedPrisonerDetails>(
      {
        path: `/contact/${contactId}/linked-prisoners?page=${page}&size=${size}`,
      },
      asSystem(user.username),
    )
  }

  async getPrisonerRestrictions(
    prisonerNumber: string,
    page: number,
    size: number,
    user: Express.User,
    currentTerm: boolean,
    paged: boolean,
  ): Promise<PagedModelPrisonerRestrictionDetails> {
    return this.get<PagedModelPrisonerRestrictionDetails>(
      {
        path: `/prisoner-restrictions/${prisonerNumber}?page=${page}&size=${size}&currentTerm=${currentTerm}&paged=${paged}`,
      },
      asSystem(user.username),
    )
  }

  async patchEmployments(contactId: number, request: PatchEmploymentsRequest, user: Express.User) {
    return this.patch(
      {
        path: `/contact/${contactId}/employment`,
        data: request,
      },
      asSystem(user.username),
    )
  }

  async deleteContactRelationship(prisonerContactId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/prisoner-contact/${prisonerContactId}`,
      },
      asSystem(user.username),
    )
  }

  async planDeleteContactRelationship(prisonerContactId: number, user: Express.User): Promise<RelationshipDeletePlan> {
    return this.get<RelationshipDeletePlan>(
      {
        path: `/prisoner-contact/${prisonerContactId}/plan-delete`,
      },
      asSystem(user.username),
    )
  }
}
