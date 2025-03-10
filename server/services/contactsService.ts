import ContactsApiClient from '../data/contactsApiClient'
import { components } from '../@types/contactsApi'
import AddContactJourney = journeys.AddContactJourney
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import Pageable = contactsApiClientTypes.Pageable
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import PrisonerContactSummaryPage = contactsApiClientTypes.PrisonerContactSummaryPage
import ContactDetails = contactsApiClientTypes.ContactDetails
import CreatePhoneRequest = contactsApiClientTypes.CreatePhoneRequest
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
import CreateContactAddressPhoneRequest = contactsApiClientTypes.CreateContactAddressPhoneRequest
import UpdateContactAddressPhoneRequest = contactsApiClientTypes.UpdateContactAddressPhoneRequest
import PatchEmploymentsRequest = contactsApiClientTypes.PatchEmploymentsRequest
import AddressMetadata = journeys.AddressMetadata
import AddressLines = journeys.AddressLines

type PageableObject = components['schemas']['PageableObject']
type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
type CreateEmailRequest = components['schemas']['CreateEmailRequest']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']
type CreateContactRequest = components['schemas']['CreateContactRequest']
type AddContactRelationshipRequest = components['schemas']['AddContactRelationshipRequest']
type ContactNameDetails = components['schemas']['ContactNameDetails']
type CreateMultipleIdentitiesRequest = components['schemas']['CreateMultipleIdentitiesRequest']
type IdentityDocument = components['schemas']['IdentityDocument']
type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']

export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: AddContactJourney, user: Express.User): Promise<ContactCreationResult> {
    const request: CreateContactRequest = {
      lastName: journey.names!.lastName!,
      firstName: journey.names!.firstName!,
      interpreterRequired: false,
      isStaff: false,
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipTypeCode: journey.relationship!.relationshipType!,
        relationshipToPrisonerCode: journey.relationship!.relationshipToPrisoner!,
        isNextOfKin: journey.relationship!.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship!.isEmergencyContact === 'YES',
        isApprovedVisitor: false,
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
    if (journey.relationship!.comments) {
      request.relationship!.comments = journey.relationship!.comments
    }
    if (journey.names!.title) {
      request.titleCode = journey.names!.title
    }
    if (journey.names!.middleNames) {
      request.middleNames = journey.names!.middleNames
    }
    return this.contactsApiClient.createContact(request, user)
  }

  async addContact(journey: AddContactJourney, user: Express.User): Promise<PrisonerContactRelationshipDetails> {
    const request: AddContactRelationshipRequest = {
      contactId: journey.contactId!,
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipTypeCode: journey.relationship!.relationshipType!,
        relationshipToPrisonerCode: journey.relationship!.relationshipToPrisoner!,
        isNextOfKin: journey.relationship!.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship!.isEmergencyContact === 'YES',
        isApprovedVisitor: false,
      },
      createdBy: user.username,
    }
    if (journey.relationship!.comments) {
      request.relationship!.comments = journey.relationship!.comments
    }
    return this.contactsApiClient.addContactRelationship(request, user)
  }

  async getPrisonerContacts(
    prisonerNumber: string,
    active: boolean,
    user: Express.User,
    pagination: PageableObject,
  ): Promise<PrisonerContactSummaryPage[]> {
    return this.contactsApiClient.getPrisonerContacts(prisonerNumber, active, user, pagination)
  }

  async searchContact(
    contactSearchRequest: ContactSearchRequest,
    pagination: Pageable,
    user: Express.User,
  ): Promise<ContactSearchResultItemPage> {
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

  async createContactPhone(
    contactId: number,
    user: Express.User,
    type: string,
    phoneNumber: string,
    extension?: string,
  ) {
    const request: CreatePhoneRequest = {
      phoneType: type,
      phoneNumber,
      extNumber: extension,
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactPhone(contactId, request, user)
  }

  async updateContactPhone(
    contactId: number,
    contactPhoneId: number,
    user: Express.User,
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
    return this.contactsApiClient.updateContactPhone(contactId, contactPhoneId, request, user)
  }

  async deleteContactPhone(contactId: number, contactPhoneId: number, user: Express.User) {
    return this.contactsApiClient.deleteContactPhone(contactId, contactPhoneId, user)
  }

  async createContactIdentities(contactId: number, user: Express.User, identities: IdentityDocument[]) {
    const request: CreateMultipleIdentitiesRequest = {
      identities,
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactIdentities(contactId, request, user)
  }

  async updateContactIdentity(
    contactId: number,
    contactIdentityId: number,
    user: Express.User,
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
    return this.contactsApiClient.updateContactIdentity(contactId, contactIdentityId, request, user)
  }

  async deleteContactIdentity(contactId: number, contactIdentityId: number, user: Express.User) {
    return this.contactsApiClient.deleteContactIdentity(contactId, contactIdentityId, user)
  }

  async updateContactById(
    contactId: number,
    request: PatchContactRequest,
    user: Express.User,
  ): Promise<PatchContactResponse> {
    return this.contactsApiClient.updateContactById(contactId, request, user)
  }

  async updateContactRelationshipById(
    prisonerContactId: number,
    request: contactsApiClientTypes.PatchRelationshipRequest,
    user: Express.User,
  ): Promise<void> {
    return this.contactsApiClient.updateContactRelationshipById(prisonerContactId, request, user)
  }

  async createContactEmail(
    contactId: number,
    request: CreateEmailRequest,
    user: Express.User,
  ): Promise<ContactEmailDetails> {
    return this.contactsApiClient.createContactEmail(contactId, request, user)
  }

  async updateContactEmail(
    contactId: number,
    contactEmailId: number,
    request: UpdateEmailRequest,
    user: Express.User,
  ): Promise<ContactEmailDetails> {
    return this.contactsApiClient.updateContactEmail(contactId, contactEmailId, request, user)
  }

  async deleteContactEmail(contactId: number, contactEmailId: number, user: Express.User) {
    return this.contactsApiClient.deleteContactEmail(contactId, contactEmailId, user)
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

  async createContactAddress(journey: AddressJourney, user: Express.User) {
    const request: CreateContactAddressRequest = {
      addressType: journey.addressType === 'DO_NOT_KNOW' ? undefined : journey.addressType,
      flat: journey.addressLines!.flat,
      property: journey.addressLines!.premises,
      street: journey.addressLines!.street,
      area: journey.addressLines!.locality,
      cityCode: journey.addressLines!.town,
      countyCode: journey.addressLines!.county,
      postcode: journey.addressLines!.postcode,
      countryCode: journey.addressLines!.country,
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
    }
    return this.contactsApiClient.createContactAddress(journey.contactId, request, user)
  }

  async updateContactAddress(
    changes: Partial<AddressJourney & AddressMetadata & AddressLines> & {
      contactId: number
      contactAddressId: number
      startDate?: Date
      endDate?: Date | null
    },
    user: Express.User,
  ) {
    const request: UpdateContactAddressRequest = {
      addressType: changes.addressType === 'DO_NOT_KNOW' ? undefined : changes.addressType,
      flat: changes.flat,
      property: changes.premises,
      street: changes.street,
      area: changes.locality,
      cityCode: changes.town,
      countyCode: changes.county,
      postcode: changes.postcode,
      countryCode: changes.country,
      noFixedAddress: changes.noFixedAddress,
      verified: false,
      primaryAddress: changes.primaryAddress,
      mailFlag: changes.mailAddress,
      startDate: changes.startDate,
      endDate: changes.endDate,
      comments: changes.comments,
      updatedBy: user.username,
    }
    return this.contactsApiClient.updateContactAddress(changes.contactId, changes.contactAddressId!, request, user)
  }

  async createContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    user: Express.User,
    type: string,
    phoneNumber: string,
    extension?: string,
  ) {
    const request: CreateContactAddressPhoneRequest = {
      contactAddressId,
      phoneType: type,
      phoneNumber,
      extNumber: extension,
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactAddressPhone(contactId, contactAddressId, request, user)
  }

  async updateContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactPhoneId: number,
    user: Express.User,
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
    return this.contactsApiClient.updateContactAddressPhone(contactId, contactAddressId, contactPhoneId, request, user)
  }

  async deleteContactAddressPhone(
    contactId: number,
    contactAddressId: number,
    contactPhoneId: number,
    user: Express.User,
  ) {
    return this.contactsApiClient.deleteContactAddressPhone(contactId, contactAddressId, contactPhoneId, user)
  }

  async getLinkedPrisoners(contactId: number, user: Express.User): Promise<LinkedPrisonerDetails[]> {
    return this.contactsApiClient.getLinkedPrisoners(contactId, user)
  }

  async patchEmployments(contactId: number, request: PatchEmploymentsRequest, user: Express.User) {
    await this.contactsApiClient.patch(
      {
        path: `/contact/${contactId}/employment`,
        data: request,
      },
      user,
    )
  }
}
