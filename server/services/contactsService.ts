import ContactsApiClient, { Pagination } from '../data/contactsApiClient'
import { components } from '../@types/contactsApi'
import AddContactJourney = journeys.AddContactJourney
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import ContactDetails = contactsApiClientTypes.ContactDetails
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import PatchContactResponse = contactsApiClientTypes.PatchContactResponse
import UpdatePhoneRequest = contactsApiClientTypes.UpdatePhoneRequest
import UpdateIdentityRequest = contactsApiClientTypes.UpdateIdentityRequest
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import PrisonerContactRestrictionsResponse = contactsApiClientTypes.PrisonerContactRestrictionsResponse
import AddressJourney = journeys.AddressJourney
import CreateContactAddressRequest = contactsApiClientTypes.CreateContactAddressRequest
import UpdateContactAddressRequest = contactsApiClientTypes.PatchContactAddressRequest
import UpdateContactAddressPhoneRequest = contactsApiClientTypes.UpdateContactAddressPhoneRequest
import PatchEmploymentsRequest = contactsApiClientTypes.PatchEmploymentsRequest
import AddressMetadata = journeys.AddressMetadata
import AddressLines = journeys.AddressLines
import PagedModelPrisonerContactSummary = contactsApiClientTypes.PagedModelPrisonerContactSummary
import PagedModelContactSearchResultItem = contactsApiClientTypes.PagedModelContactSearchResultItem
import PrisonerContactFilter = contactsApiClientTypes.PrisonerContactFilter
import PrisonerContactPagination = contactsApiClientTypes.PrisonerContactPagination
import AuditService from './auditService'
import AuditedService from './auditedService'

type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']
type CreateContactRequest = components['schemas']['CreateContactRequest']
type AddContactRelationshipRequest = components['schemas']['AddContactRelationshipRequest']
type ContactNameDetails = components['schemas']['ContactNameDetails']
type CreateMultipleIdentitiesRequest = components['schemas']['CreateMultipleIdentitiesRequest']
type IdentityDocument = components['schemas']['IdentityDocument']
type PagedModelLinkedPrisonerDetails = components['schemas']['PagedModelLinkedPrisonerDetails']
type CreateMultipleEmailsRequest = components['schemas']['CreateMultipleEmailsRequest']
type CreateMultiplePhoneNumbersRequest = components['schemas']['CreateMultiplePhoneNumbersRequest']

export default class ContactsService extends AuditedService {
  constructor(
    private readonly contactsApiClient: ContactsApiClient,
    override readonly auditService: AuditService,
  ) {
    super(auditService)
  }

  async createContact(
    journey: AddContactJourney,
    user: Express.User,
    correlationId: string,
  ): Promise<ContactCreationResult> {
    const request: CreateContactRequest = {
      ...(journey?.names?.title === undefined ? {} : { titleCode: journey.names.title }),
      lastName: journey.names!.lastName!,
      ...(journey?.names?.middleNames === undefined ? {} : { middleNames: journey.names.middleNames }),
      firstName: journey.names!.firstName!,
      interpreterRequired: journey.languageAndInterpreter?.interpreterRequired === 'YES',
      isStaff: journey.isStaff === 'YES',
      ...(journey.gender === undefined ? {} : { genderCode: journey.gender }),
      ...(journey.identities === undefined ? {} : { identities: journey.identities }),
      ...(journey.emailAddresses === undefined ? {} : { emailAddresses: journey.emailAddresses }),
      ...(journey.domesticStatusCode === undefined ? {} : { domesticStatusCode: journey.domesticStatusCode }),
      ...(journey?.languageAndInterpreter?.language === undefined
        ? {}
        : { languageCode: journey?.languageAndInterpreter?.language }),
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipTypeCode: journey.relationship!.relationshipType!,
        relationshipToPrisonerCode: journey.relationship!.relationshipToPrisoner!,
        isNextOfKin: journey.relationship!.isNextOfKin ?? false,
        isEmergencyContact: journey.relationship!.isEmergencyContact ?? false,
        isApprovedVisitor: journey.relationship?.isApprovedVisitor ?? false,
        ...(journey?.relationship?.comments === undefined ? {} : { comments: journey.relationship.comments }),
      },
      createdBy: user.username,
    }
    if (journey.dateOfBirth?.isKnown === 'YES') {
      request.dateOfBirth = new Date(
        `${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`,
      )
        .toISOString()
        .substring(0, 10)
    }
    if (journey.phoneNumbers && journey.phoneNumbers.length > 0) {
      request.phoneNumbers = journey.phoneNumbers.map(({ type, phoneNumber, extension }) => ({
        phoneType: type,
        phoneNumber,
        ...(extension === undefined ? {} : { extNumber: extension }),
      }))
    }
    if (journey.employments?.length && journey.relationship?.relationshipType === 'O') {
      request.employments = journey.employments.map(employment => ({
        organisationId: employment.employer.organisationId,
        isActive: employment.isActive!,
      }))
    }
    if (journey.addresses?.length) {
      request.addresses = journey.addresses.map(item => {
        const { flat, property, street, area, cityCode, countyCode, postcode, countryCode } = item.addressLines!
        const address: Exclude<CreateContactRequest['addresses'], undefined>[number] = {
          verified: false,
          countryCode,
          primaryAddress: item.addressMetadata!.primaryAddress || false,
          startDate: new Date(`${item.addressMetadata!.fromYear}-${item.addressMetadata!.fromMonth}-01Z`).toISOString(),
          noFixedAddress: item.addressLines!.noFixedAddress,
          phoneNumbers:
            item.phoneNumbers?.map(({ type, phoneNumber, extension }) => ({
              phoneType: type,
              phoneNumber,
              ...(extension === undefined ? {} : { extNumber: extension }),
            })) || [],
        }
        if (flat) address.flat = flat
        if (property) address.property = property
        if (street) address.street = street
        if (area) address.area = area
        if (cityCode) address.cityCode = cityCode
        if (countyCode) address.countyCode = countyCode
        if (postcode) address.postcode = postcode
        if (item.addressType !== 'DO_NOT_KNOW' && item.addressType !== undefined) {
          address.addressType = item.addressType
        }
        if (item.addressMetadata!.mailAddress !== undefined) {
          address.mailFlag = item.addressMetadata!.mailAddress
        }
        if (item.addressMetadata!.toMonth && item.addressMetadata!.toYear) {
          address.endDate = new Date(
            `${item.addressMetadata!.toYear}-${item.addressMetadata!.toMonth}-01Z`,
          ).toISOString()
        }
        if (item.addressMetadata!.comments !== undefined && item.addressMetadata!.comments !== null) {
          address.comments = item.addressMetadata!.comments
        }
        return address
      })
    }
    return this.handleAuditEvent(this.contactsApiClient.createContact(request, user), {
      what: 'API_POST_CONTACT',
      who: user.username,
      subjectType: 'CONTACT',
      details: {
        prisonNumber: journey.prisonerNumber,
        isApprovedVisitor: request.relationship?.isApprovedVisitor ?? false,
      },
      correlationId,
    })
  }

  async addContact(
    journey: AddContactJourney,
    user: Express.User,
    correlationId: string,
  ): Promise<PrisonerContactRelationshipDetails> {
    const request: AddContactRelationshipRequest = {
      contactId: journey.contactId!,
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipTypeCode: journey.relationship!.relationshipType!,
        relationshipToPrisonerCode: journey.relationship!.relationshipToPrisoner!,
        isNextOfKin: journey.relationship!.isNextOfKin ?? false,
        isEmergencyContact: journey.relationship!.isEmergencyContact ?? false,
        isApprovedVisitor: journey.relationship?.isApprovedVisitor ?? false,
      },
      createdBy: user.username,
    }
    if (journey.relationship!.comments) {
      request.relationship!.comments = journey.relationship!.comments
    }
    return this.handleAuditEvent(this.contactsApiClient.addContactRelationship(request, user), {
      what: 'API_POST_CONTACT_RELATIONSHIP',
      who: user.username,
      subjectType: 'CONTACT_RELATIONSHIP',
      details: {
        contactId: journey.contactId,
        prisonNumber: journey.prisonerNumber,
        isApprovedVisitor: request.relationship.isApprovedVisitor,
      },
      correlationId,
    })
  }

  async filterPrisonerContacts(
    prisonerNumber: string,
    filter: PrisonerContactFilter,
    pagination: PrisonerContactPagination,
    user: Express.User,
  ): Promise<PagedModelPrisonerContactSummary> {
    return this.contactsApiClient.filterPrisonerContacts(prisonerNumber, filter, pagination, user)
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    pagination: Pagination,
    user: Express.User,
  ): Promise<PagedModelContactSearchResultItem> {
    return this.contactsApiClient.searchContact(contactSearchRequest, user, pagination)
  }

  async getContact(contactId: number, user: Express.User): Promise<ContactDetails> {
    return this.contactsApiClient.getContact(contactId, user)
  }

  async getContactName(contactId: number, user: Express.User): Promise<ContactNameDetails> {
    return this.contactsApiClient.getContactName(contactId, user)
  }

  async getPrisonerContactRelationship(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRelationshipDetails> {
    return this.contactsApiClient.getPrisonerContactRelationship(prisonerContactId, user)
  }

  async createContactPhones(
    contactId: number,
    user: Express.User,
    phones: { type: string; phoneNumber: string; extension?: string | undefined }[],
    correlationId: string,
  ) {
    const request: CreateMultiplePhoneNumbersRequest = {
      phoneNumbers: phones.map(({ type, phoneNumber, extension }) => ({
        phoneType: type,
        phoneNumber,
        ...(extension === undefined ? {} : { extNumber: extension }),
      })),
      createdBy: user.username,
    }
    return this.handleAuditEvent(this.contactsApiClient.createContactPhones(contactId, request, user), {
      what: 'API_POST_CONTACT_PHONES',
      who: user.username,
      subjectType: 'CONTACT_PHONE',
      details: { contactId },
      correlationId,
    })
  }

  async updateContactPhone(
    contactId: number,
    contactPhoneId: number,
    user: Express.User,
    correlationId: string,
    type: string,
    phoneNumber: string,
    extension?: string,
  ) {
    const request: UpdatePhoneRequest = {
      phoneType: type,
      phoneNumber,
      extNumber: extension,
      updatedBy: user.username,
    }
    return this.handleAuditEvent(this.contactsApiClient.updateContactPhone(contactId, contactPhoneId, request, user), {
      what: 'API_PUT_CONTACT_PHONE',
      who: user.username,
      subjectType: 'CONTACT_PHONE',
      subjectId: String(contactPhoneId),
      details: { contactId },
      correlationId,
    })
  }

  async deleteContactPhone(contactId: number, contactPhoneId: number, user: Express.User, correlationId: string) {
    return this.handleAuditEvent(this.contactsApiClient.deleteContactPhone(contactId, contactPhoneId, user), {
      what: 'API_DELETE_CONTACT_PHONE',
      who: user.username,
      subjectType: 'CONTACT_PHONE',
      subjectId: String(contactPhoneId),
      details: { contactId },
      correlationId,
    })
  }

  async createContactIdentities(
    contactId: number,
    user: Express.User,
    identities: IdentityDocument[],
    correlationId: string,
  ) {
    const request: CreateMultipleIdentitiesRequest = {
      identities,
      createdBy: user.username,
    }
    return this.handleAuditEvent(this.contactsApiClient.createContactIdentities(contactId, request, user), {
      what: 'API_POST_CONTACT_IDENTITIES',
      who: user.username,
      subjectType: 'CONTACT_IDENTITY',
      details: { contactId },
      correlationId,
    })
  }

  async updateContactIdentity(
    contactId: number,
    contactIdentityId: number,
    user: Express.User,
    correlationId: string,
    identityType: string,
    identityValue: string,
    issuingAuthority?: string,
  ) {
    const request: UpdateIdentityRequest = {
      identityType,
      identityValue,
      issuingAuthority,
      updatedBy: user.username,
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updateContactIdentity(contactId, contactIdentityId, request, user),
      {
        what: 'API_PUT_CONTACT_IDENTITY',
        who: user.username,
        subjectType: 'CONTACT_IDENTITY',
        subjectId: String(contactIdentityId),
        details: { contactId },
        correlationId,
      },
    )
  }

  async deleteContactIdentity(contactId: number, contactIdentityId: number, user: Express.User, correlationId: string) {
    return this.handleAuditEvent(this.contactsApiClient.deleteContactIdentity(contactId, contactIdentityId, user), {
      what: 'API_DELETE_CONTACT_IDENTITY',
      who: user.username,
      subjectType: 'CONTACT_IDENTITY',
      subjectId: String(contactIdentityId),
      details: { contactId },
      correlationId,
    })
  }

  async updateContactById(
    contactId: number,
    request: PatchContactRequest,
    user: Express.User,
    correlationId: string,
  ): Promise<PatchContactResponse> {
    return this.handleAuditEvent(this.contactsApiClient.updateContactById(contactId, request, user), {
      what: 'API_PATCH_CONTACT',
      who: user.username,
      subjectType: 'CONTACT',
      subjectId: String(contactId),
      correlationId,
    })
  }

  async updateContactRelationshipById(
    prisonerContactId: number,
    request: contactsApiClientTypes.PatchRelationshipRequest,
    user: Express.User,
    correlationId: string,
  ): Promise<void> {
    const { comments, updatedBy, ...detailsToAudit } = request
    return this.handleAuditEvent(
      this.contactsApiClient.updateContactRelationshipById(prisonerContactId, request, user),
      {
        what: 'API_PATCH_CONTACT_RELATIONSHIP',
        who: user.username,
        subjectType: 'CONTACT_RELATIONSHIP',
        subjectId: String(prisonerContactId),
        correlationId,
        details: { prisonerContactId, ...detailsToAudit },
      },
    )
  }

  async createContactEmails(
    contactId: number,
    request: CreateMultipleEmailsRequest,
    user: Express.User,
    correlationId: string,
  ): Promise<ContactEmailDetails[]> {
    return this.handleAuditEvent(this.contactsApiClient.createContactEmails(contactId, request, user), {
      what: 'API_POST_CONTACT_EMAILS',
      who: user.username,
      subjectType: 'CONTACT_EMAIL',
      details: { contactId },
      correlationId,
    })
  }

  async updateContactEmail(
    contactId: number,
    contactEmailId: number,
    request: UpdateEmailRequest,
    user: Express.User,
    correlationId: string,
  ): Promise<ContactEmailDetails> {
    return this.handleAuditEvent(this.contactsApiClient.updateContactEmail(contactId, contactEmailId, request, user), {
      what: 'API_PUT_CONTACT_EMAIL',
      who: user.username,
      subjectType: 'CONTACT_EMAIL',
      subjectId: String(contactEmailId),
      details: { contactId },
      correlationId,
    })
  }

  async deleteContactEmail(contactId: number, contactEmailId: number, user: Express.User, correlationId: string) {
    return this.handleAuditEvent(this.contactsApiClient.deleteContactEmail(contactId, contactEmailId, user), {
      what: 'API_DELETE_CONTACT_EMAIL',
      who: user.username,
      subjectType: 'CONTACT_EMAIL',
      subjectId: String(contactEmailId),
      details: { contactId },
      correlationId,
    })
  }

  async getGlobalContactRestrictions(contactId: number, user: Express.User): Promise<ContactRestrictionDetails[]> {
    return this.contactsApiClient.getGlobalContactRestrictions(contactId, user)
  }

  async getPrisonerContactRestrictions(
    prisonerContactId: number,
    user: Express.User,
  ): Promise<PrisonerContactRestrictionsResponse> {
    return this.contactsApiClient.getPrisonerContactRestrictions(prisonerContactId, user)
  }

  async createContactAddress(journey: AddressJourney, user: Express.User, correlationId: string) {
    const request: CreateContactAddressRequest = {
      addressType: journey.addressType === 'DO_NOT_KNOW' ? undefined : journey.addressType,
      ...journey.addressLines!,
      verified: false,
      primaryAddress: journey.addressMetadata!.primaryAddress,
      mailFlag: journey.addressMetadata!.mailAddress,
      startDate: new Date(`${journey.addressMetadata!.fromYear}-${journey.addressMetadata!.fromMonth}-01Z`),
      endDate:
        journey.addressMetadata!.toMonth && journey.addressMetadata!.toYear
          ? new Date(`${journey.addressMetadata!.toYear}-${journey.addressMetadata!.toMonth}-01Z`)
          : undefined,
      noFixedAddress: journey.addressLines!.noFixedAddress,
      comments: journey.addressMetadata!.comments,
      createdBy: user.username,

      phoneNumbers:
        journey.phoneNumbers?.map(({ type, phoneNumber, extension }) => ({
          phoneType: type,
          phoneNumber,
          ...(extension === undefined ? {} : { extNumber: extension }),
        })) || [],
    }
    return this.handleAuditEvent(this.contactsApiClient.createContactAddress(journey.contactId, request, user), {
      what: 'API_POST_CONTACT_ADDRESSES',
      who: user.username,
      subjectType: 'CONTACT_ADDRESS',
      details: { contactId: journey.contactId },
      correlationId,
    })
  }

  async updateContactAddress(
    changes: Partial<AddressJourney & AddressMetadata & AddressLines> & {
      contactId: number
      contactAddressId: number
      startDate?: Date
      endDate?: Date | null
    },
    user: Express.User,
    correlationId: string,
  ) {
    const request: UpdateContactAddressRequest = {
      addressType: changes.addressType === 'DO_NOT_KNOW' ? null : changes.addressType,
      flat: changes.flat,
      property: changes.property,
      street: changes.street,
      area: changes.area,
      cityCode: changes.cityCode,
      countyCode: changes.countyCode,
      postcode: changes.postcode,
      countryCode: changes.countryCode,
      noFixedAddress: changes.noFixedAddress,
      verified: false,
      primaryAddress: changes.primaryAddress,
      mailFlag: changes.mailAddress,
      startDate: changes.startDate,
      endDate: changes.endDate,
      comments: changes.comments,
      updatedBy: user.username,
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updateContactAddress(changes.contactId, changes.contactAddressId!, request, user),
      {
        what: 'API_PATCH_CONTACT_ADDRESS',
        who: user.username,
        subjectType: 'CONTACT_ADDRESS',
        subjectId: String(changes.contactAddressId),
        details: { contactId: changes.contactId },
        correlationId,
      },
    )
  }

  async createContactAddressPhones(
    contactId: number,
    contactAddressId: number,
    user: Express.User,
    phones: { type: string; phoneNumber: string; extension?: string | undefined }[],
    correlationId: string,
  ) {
    const request: CreateMultiplePhoneNumbersRequest = {
      phoneNumbers: phones.map(({ type, phoneNumber, extension }) => ({
        phoneType: type,
        phoneNumber,
        ...(extension === undefined ? {} : { extNumber: extension }),
      })),
      createdBy: user.username,
    }
    return this.handleAuditEvent(
      this.contactsApiClient.createContactAddressPhones(contactId, contactAddressId, request, user),
      {
        what: 'API_POST_CONTACT_ADDRESS_PHONES',
        who: user.username,
        subjectType: 'CONTACT_ADDRESS_PHONE',
        details: { contactId, contactAddressId },
        correlationId,
      },
    )
  }

  async updateContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactAddressPhoneId: number,
    user: Express.User,
    correlationId: string,
    type: string,
    phoneNumber: string,
    extension?: string,
  ) {
    const request: UpdateContactAddressPhoneRequest = {
      phoneType: type,
      phoneNumber,
      extNumber: extension,
      updatedBy: user.username,
    }
    return this.handleAuditEvent(
      this.contactsApiClient.updateContactAddressPhone(
        contactId,
        contactAddressId,
        contactAddressPhoneId,
        request,
        user,
      ),
      {
        what: 'API_PUT_CONTACT_ADDRESS_PHONE',
        who: user.username,
        subjectType: 'CONTACT_ADDRESS_PHONE',
        subjectId: String(contactAddressPhoneId),
        details: { contactId, contactAddressId },
        correlationId,
      },
    )
  }

  async deleteContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactAddressPhoneId: number,
    user: Express.User,
    correlationId: string,
  ) {
    return this.handleAuditEvent(
      this.contactsApiClient.deleteContactAddressPhone(contactId, contactAddressId, contactAddressPhoneId, user),
      {
        what: 'API_DELETE_CONTACT_ADDRESS_PHONE',
        who: user.username,
        subjectType: 'CONTACT_ADDRESS_PHONE',
        subjectId: String(contactAddressPhoneId),
        details: { contactId, contactAddressId },
        correlationId,
      },
    )
  }

  async getLinkedPrisoners(
    contactId: number,
    page: number,
    size: number,
    user: Express.User,
  ): Promise<PagedModelLinkedPrisonerDetails> {
    return this.contactsApiClient.getLinkedPrisoners(contactId, page, size, user)
  }

  async patchEmployments(
    contactId: number,
    request: PatchEmploymentsRequest,
    user: Express.User,
    correlationId: string,
  ) {
    await this.handleAuditEvent(this.contactsApiClient.patchEmployments(contactId, request, user), {
      what: 'API_PATCH_CONTACT_EMPLOYMENTS',
      who: user.username,
      subjectType: 'CONTACT_EMPLOYMENT',
      details: { contactId },
      correlationId,
    })
  }
}
