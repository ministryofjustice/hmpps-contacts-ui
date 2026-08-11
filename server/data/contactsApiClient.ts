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

  async createContact(request: CreateContactRequest, username: string): Promise<ContactCreationResult> {
    return this.post<ContactCreationResult>(
      {
        path: `/contact`,
        data: request,
      },
      asSystem(username),
    )
  }

  async addContactRelationship(
    request: AddContactRelationshipRequest,
    username: string,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.post<PrisonerContactRelationshipDetails>(
      {
        path: `/prisoner-contact`,
        data: request,
      },
      asSystem(username),
    )
  }

  async filterPrisonerContacts(
    prisonerNumber: string,
    filter: PrisonerContactFilter,
    pagination: PrisonerContactPagination,
    username: string,
  ): Promise<PagedModelPrisonerContactSummary> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.contactsApi.pageSize || 10 }
    return this.get<PagedModelPrisonerContactSummary>(
      {
        path: `/prisoner/${prisonerNumber}/contact`,
        query: { ...paginationParameters, ...filter },
      },
      asSystem(username),
    )
  }

  async getAllSummariesForPrisonerAndContact(
    prisonerNumber: string,
    contactId: number,
    username: string,
  ): Promise<PrisonerContactSummary[]> {
    return this.get<PrisonerContactSummary[]>(
      {
        path: `/prisoner/${prisonerNumber}/contact/${contactId}`,
      },
      asSystem(username),
    )
  }

  async getReferenceCodes(type: ReferenceCodeType, username: string): Promise<ReferenceCode[]> {
    return this.get<ReferenceCode[]>(
      {
        path: `/reference-codes/group/${type}`,
      },
      asSystem(username),
    )
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    username: string,
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
      asSystem(username),
    )
  }

  async getContact(contactId: number, username: string): Promise<ContactDetails> {
    return this.get<ContactDetails>({ path: `/contact/${contactId}` }, asSystem(username))
  }

  async getContactHistory(contactId: number, username: string): Promise<ContactAuditEntry[]> {
    return this.get<ContactAuditEntry[]>({ path: `/contact/${contactId}/history` }, asSystem(username))
  }

  async getContactName(contactId: number, username: string): Promise<ContactNameDetails> {
    return this.get<ContactNameDetails>({ path: `/contact/${contactId}/name` }, asSystem(username))
  }

  async getPrisonerContactRelationship(
    prisonerContactId: number,
    username: string,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.get<PrisonerContactRelationshipDetails>(
      { path: `/prisoner-contact/${prisonerContactId}` },
      asSystem(username),
    )
  }

  async createContactPhones(
    contactId: number,
    request: CreateMultiplePhoneNumbersRequest,
    username: string,
  ): Promise<ContactPhoneDetails[]> {
    return this.post<ContactPhoneDetails[]>(
      {
        path: `/contact/${contactId}/phones`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactPhone(
    contactId: number,
    contactPhoneId: number,
    request: UpdatePhoneRequest,
    username: string,
  ): Promise<ContactPhoneDetails> {
    return this.put<ContactPhoneDetails>(
      {
        path: `/contact/${contactId}/phone/${contactPhoneId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async deleteContactPhone(contactId: number, contactPhoneId: number, username: string): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/phone/${contactPhoneId}`,
      },
      asSystem(username),
    )
  }

  async createContactIdentity(
    contactId: number,
    request: CreateIdentityRequest,
    username: string,
  ): Promise<ContactIdentityDetails> {
    return this.post<ContactIdentityDetails>(
      {
        path: `/contact/${contactId}/identity`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactIdentity(
    contactId: number,
    contactIdentityId: number,
    request: UpdateIdentityRequest,
    username: string,
  ): Promise<ContactIdentityDetails> {
    return this.put<ContactIdentityDetails>(
      {
        path: `/contact/${contactId}/identity/${contactIdentityId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async deleteContactIdentity(contactId: number, contactIdentityId: number, username: string): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/identity/${contactIdentityId}`,
      },
      asSystem(username),
    )
  }

  async updateContactById(
    contactId: number,
    request: PatchContactRequest,
    username: string,
  ): Promise<PatchContactResponse> {
    return this.patch<PatchContactResponse>(
      {
        path: `/contact/${contactId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactRelationshipById(
    prisonerContactId: number,
    request: PatchRelationshipRequest,
    username: string,
  ): Promise<void> {
    return this.patch(
      {
        path: `/prisoner-contact/${prisonerContactId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async createContactEmails(
    contactId: number,
    request: CreateMultipleEmailsRequest,
    username: string,
  ): Promise<ContactEmailDetails[]> {
    return this.post<ContactEmailDetails[]>(
      {
        path: `/contact/${contactId}/emails`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactEmail(
    contactId: number,
    contactEmailId: number,
    request: UpdateEmailRequest,
    username: string,
  ): Promise<ContactEmailDetails> {
    return this.put<ContactEmailDetails>(
      {
        path: `/contact/${contactId}/email/${contactEmailId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async deleteContactEmail(contactId: number, contactEmailId: number, username: string): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/email/${contactEmailId}`,
      },
      asSystem(username),
    )
  }

  async createContactGlobalRestriction(
    contactId: number,
    request: CreateContactRestrictionRequest,
    username: string,
  ): Promise<ContactRestrictionDetails> {
    return this.post<ContactRestrictionDetails>(
      {
        path: `/contact/${contactId}/restriction`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactGlobalRestriction(
    contactId: number,
    contactRestrictionId: number,
    request: UpdateContactRestrictionRequest,
    username: string,
  ): Promise<ContactRestrictionDetails> {
    return this.put<ContactRestrictionDetails>(
      {
        path: `/contact/${contactId}/restriction/${contactRestrictionId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async createPrisonerContactRestriction(
    prisonerContactId: number,
    request: CreatePrisonerContactRestrictionRequest,
    username: string,
  ): Promise<PrisonerContactRestrictionDetails> {
    return this.post<PrisonerContactRestrictionDetails>(
      {
        path: `/prisoner-contact/${prisonerContactId}/restriction`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updatePrisonerContactRestriction(
    prisonerContactId: number,
    prisonerContactRestrictionId: number,
    request: UpdatePrisonerContactRestrictionRequest,
    username: string,
  ): Promise<PrisonerContactRestrictionDetails> {
    return this.put<PrisonerContactRestrictionDetails>(
      {
        path: `/prisoner-contact/${prisonerContactId}/restriction/${prisonerContactRestrictionId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async getGlobalContactRestrictions(contactId: number, username: string): Promise<ContactRestrictionDetails[]> {
    return this.get<ContactRestrictionDetails[]>({ path: `/contact/${contactId}/restriction` }, asSystem(username))
  }

  async getPrisonerContactRestrictions(
    prisonerContactId: number,
    username: string,
  ): Promise<PrisonerContactRestrictionsResponse> {
    return this.get<PrisonerContactRestrictionsResponse>(
      { path: `/prisoner-contact/${prisonerContactId}/restriction` },
      asSystem(username),
    )
  }

  async createContactAddress(
    contactId: number,
    request: CreateContactAddressRequest,
    username: string,
  ): Promise<ContactAddressDetails> {
    return this.post<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactAddress(
    contactId: number,
    contactAddressId: number,
    request: PatchContactAddressRequest,
    username: string,
  ): Promise<ContactAddressDetails> {
    return this.patch<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async createContactAddressPhones(
    contactId: number,
    contactAddressId: number,
    request: CreateMultiplePhoneNumbersRequest,
    username: string,
  ): Promise<ContactAddressPhoneDetails[]> {
    return this.post<ContactAddressPhoneDetails[]>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phones`,
        data: request,
      },
      asSystem(username),
    )
  }

  async updateContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactAddressPhoneId: number,
    request: UpdateContactAddressPhoneRequest,
    username: string,
  ): Promise<ContactAddressPhoneDetails> {
    return this.put<ContactAddressPhoneDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phone/${contactAddressPhoneId}`,
        data: request,
      },
      asSystem(username),
    )
  }

  async deleteContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactAddressPhoneId: number,
    username: string,
  ): Promise<void> {
    return this.delete(
      {
        path: `/contact/${contactId}/address/${contactAddressId}/phone/${contactAddressPhoneId}`,
      },
      asSystem(username),
    )
  }

  async getLinkedPrisoners(
    contactId: number,
    page: number,
    size: number,
    username: string,
  ): Promise<PagedModelLinkedPrisonerDetails> {
    return this.get<PagedModelLinkedPrisonerDetails>(
      {
        path: `/contact/${contactId}/linked-prisoners?page=${page}&size=${size}`,
      },
      asSystem(username),
    )
  }

  async getPrisonerRestrictions(
    prisonerNumber: string,
    page: number,
    size: number,
    username: string,
    currentTerm: boolean,
    paged: boolean,
  ): Promise<PagedModelPrisonerRestrictionDetails> {
    return this.get<PagedModelPrisonerRestrictionDetails>(
      {
        path: `/prisoner-restrictions/${prisonerNumber}?page=${page}&size=${size}&currentTerm=${currentTerm}&paged=${paged}`,
      },
      asSystem(username),
    )
  }

  async patchEmployments(contactId: number, request: PatchEmploymentsRequest, username: string) {
    return this.patch(
      {
        path: `/contact/${contactId}/employment`,
        data: request,
      },
      asSystem(username),
    )
  }

  async deleteContactRelationship(prisonerContactId: number, username: string): Promise<void> {
    return this.delete(
      {
        path: `/prisoner-contact/${prisonerContactId}`,
      },
      asSystem(username),
    )
  }

  async planDeleteContactRelationship(prisonerContactId: number, username: string): Promise<RelationshipDeletePlan> {
    return this.get<RelationshipDeletePlan>(
      {
        path: `/prisoner-contact/${prisonerContactId}/plan-delete`,
      },
      asSystem(username),
    )
  }
}
