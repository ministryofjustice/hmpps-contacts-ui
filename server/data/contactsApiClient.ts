import config from '../config'
import RestClient from './restClient'
import ReferenceCodeType from '../enumeration/referenceCodeType'
import {
  AddContactRelationshipRequest,
  ContactAddressDetails,
  ContactAddressPhoneDetails,
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
  CreateMultipleEmailsRequest,
  CreateMultipleIdentitiesRequest,
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
      user,
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
      user,
    )
  }

  async getReferenceCodes(type: ReferenceCodeType, user: Express.User): Promise<ReferenceCode[]> {
    return this.get<ReferenceCode[]>(
      {
        path: `/reference-codes/group/${type}`,
      },
      user,
    )
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    user: Express.User,
    pagination?: Pagination,
  ): Promise<PagedModelContactSearchResultItem> {
    const paginationParameters = pagination ?? { page: 0, size: config.apis.contactsApi.pageSize || 10 }
    if (paginationParameters.sort === 'lastName,asc') {
      paginationParameters.sort = ['lastName,asc', 'firstName,asc', 'middleNames,asc', 'id,asc']
    } else if (paginationParameters.sort === 'lastName,desc') {
      paginationParameters.sort = ['lastName,desc', 'firstName,desc', 'middleNames,desc', 'id,desc']
    } else if (paginationParameters.sort === 'dateOfBirth,asc') {
      paginationParameters.sort = [
        paginationParameters.sort,
        'lastName,asc',
        'firstName,asc',
        'middleNames,asc',
        'id,asc',
      ]
    } else if (paginationParameters.sort === 'dateOfBirth,desc') {
      paginationParameters.sort = [
        paginationParameters.sort,
        'lastName,desc',
        'firstName,desc',
        'middleNames,desc',
        'id,desc',
      ]
    }
    return this.get(
      {
        path: `/contact/search`,
        query: {
          lastName: contactSearchRequest.lastName,
          firstName: contactSearchRequest.firstName,
          middleNames: contactSearchRequest.middleNames,
          dateOfBirth: contactSearchRequest.dateOfBirth,
          includeAnyExistingRelationshipsToPrisoner: contactSearchRequest.includeAnyExistingRelationshipsToPrisoner,
          ...paginationParameters,
        },
      },
      user,
    )
  }

  async getContact(contactId: number, user: Express.User): Promise<ContactDetails> {
    return this.get<ContactDetails>({ path: `/contact/${contactId}` }, user)
  }

  async getContactName(contactId: number, user: Express.User): Promise<ContactNameDetails> {
    return this.get<ContactNameDetails>({ path: `/contact/${contactId}/name` }, user)
  }

  async getPrisonerContactRelationship(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.get<PrisonerContactRelationshipDetails>({ path: `/prisoner-contact/${prisonerContactId}` }, user)
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

  async createContactIdentities(
    contactId: number,
    request: CreateMultipleIdentitiesRequest,
    user: Express.User,
  ): Promise<ContactIdentityDetails[]> {
    return this.post<ContactIdentityDetails[]>(
      {
        path: `/contact/${contactId}/identities`,
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
    return this.patch<PatchContactResponse>(
      {
        path: `/contact/${contactId}`,
        data: request,
      },
      user,
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
      user,
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
  ): Promise<ContactAddressDetails> {
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
    request: PatchContactAddressRequest,
    user: Express.User,
  ): Promise<ContactAddressDetails> {
    return this.patch<ContactAddressDetails>(
      {
        path: `/contact/${contactId}/address/${contactAddressId}`,
        data: request,
      },
      user,
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
      user,
    )
  }

  async getPrisonerRestrictions(
    prisonerNumber: string,
    page: number,
    size: number,
    user: Express.User,
    currentTerm: boolean,
  ): Promise<PagedModelPrisonerRestrictionDetails> {
    return this.get<PagedModelPrisonerRestrictionDetails>(
      {
        path: `/prisoner-restrictions/${prisonerNumber}?page=${page}&size=${size}&currentTerm=${currentTerm}`,
      },
      user,
    )
  }

  async patchEmployments(contactId: number, request: PatchEmploymentsRequest, user: Express.User) {
    return this.patch(
      {
        path: `/contact/${contactId}/employment`,
        data: request,
      },
      user,
    )
  }

  async deleteContactRelationship(prisonerContactId: number, user: Express.User): Promise<void> {
    return this.delete(
      {
        path: `/prisoner-contact/${prisonerContactId}`,
      },
      user,
    )
  }

  async planDeleteContactRelationship(prisonerContactId: number, user: Express.User): Promise<RelationshipDeletePlan> {
    return this.get<RelationshipDeletePlan>(
      {
        path: `/prisoner-contact/${prisonerContactId}/plan-delete`,
      },
      user,
    )
  }
}
