import ContactsApiClient from '../data/contactsApiClient'
import { components } from '../@types/contactsApi'
import AddContactJourney = journeys.AddContactJourney
import CreateContactRequest = contactsApiClientTypes.CreateContactRequest
import ContactSearchRequest = contactsApiClientTypes.ContactSearchRequest
import Pageable = contactsApiClientTypes.Pageable
import AddContactRelationshipRequest = contactsApiClientTypes.AddContactRelationshipRequest
import ContactSearchResultItemPage = contactsApiClientTypes.ContactSearchResultItemPage
import PrisonerContactSummaryPage = contactsApiClientTypes.PrisonerContactSummaryPage
import ContactDetails = contactsApiClientTypes.ContactDetails
import CreatePhoneRequest = contactsApiClientTypes.CreatePhoneRequest
import PatchContactRequest = contactsApiClientTypes.PatchContactRequest
import PatchContactResponse = contactsApiClientTypes.PatchContactResponse
import UpdatePhoneRequest = contactsApiClientTypes.UpdatePhoneRequest
import CreateIdentityRequest = contactsApiClientTypes.CreateIdentityRequest
import UpdateIdentityRequest = contactsApiClientTypes.UpdateIdentityRequest
import PrisonerContactRelationshipDetails = contactsApiClientTypes.PrisonerContactRelationshipDetails
import ContactCreationResult = contactsApiClientTypes.ContactCreationResult
import ContactRestrictionDetails = contactsApiClientTypes.ContactRestrictionDetails
import PrisonerContactRestrictionsResponse = contactsApiClientTypes.PrisonerContactRestrictionsResponse
import AddressJourney = journeys.AddressJourney
import CreateContactAddressRequest = contactsApiClientTypes.CreateContactAddressRequest
import UpdateContactAddressRequest = contactsApiClientTypes.UpdateContactAddressRequest
import CreateContactAddressPhoneRequest = contactsApiClientTypes.CreateContactAddressPhoneRequest
import UpdateContactAddressPhoneRequest = contactsApiClientTypes.UpdateContactAddressPhoneRequest
import LinkedPrisonerDetails = contactsApiClientTypes.LinkedPrisonerDetails
import OrganisationSummaryResultItemPage = contactsApiClientTypes.OrganisationSummaryResultItemPage

type PageableObject = components['schemas']['PageableObject']
type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
type CreateEmailRequest = components['schemas']['CreateEmailRequest']
type ContactEmailDetails = components['schemas']['ContactEmailDetails']

export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: AddContactJourney, user: Express.User): Promise<ContactCreationResult> {
    let dateOfBirth: Date | undefined
    if (journey.dateOfBirth?.isKnown === 'YES') {
      dateOfBirth = new Date(`${journey.dateOfBirth.year}-${journey.dateOfBirth.month}-${journey.dateOfBirth.day}Z`)
    }
    const request: CreateContactRequest = {
      title: journey.names!.title,
      lastName: journey.names!.lastName,
      firstName: journey.names!.firstName,
      middleNames: journey.names!.middleNames,
      dateOfBirth,
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipType: journey.relationship!.relationshipType,
        relationshipToPrisoner: journey.relationship!.relationshipToPrisoner,
        isNextOfKin: journey.relationship!.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship!.isEmergencyContact === 'YES',
        comments: journey.relationship!.comments,
      },
      createdBy: user.username,
    }
    return this.contactsApiClient.createContact(request, user)
  }

  async addContact(journey: AddContactJourney, user: Express.User): Promise<PrisonerContactRelationshipDetails> {
    const request: AddContactRelationshipRequest = {
      contactId: journey.contactId,
      relationship: {
        prisonerNumber: journey.prisonerNumber,
        relationshipType: journey.relationship!.relationshipType,
        relationshipToPrisoner: journey.relationship!.relationshipToPrisoner,
        isNextOfKin: journey.relationship!.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship!.isEmergencyContact === 'YES',
        comments: journey.relationship!.comments,
      },
      createdBy: user.username,
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

  async createContactIdentity(
    contactId: number,
    user: Express.User,
    identityType: string,
    identityValue: string,
    issuingAuthority?: string,
  ) {
    const request: CreateIdentityRequest = {
      identityType,
      identityValue,
      issuingAuthority,
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactIdentity(contactId, request, user)
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
    request: contactsApiClientTypes.UpdateRelationshipRequest,
    user: Express.User,
  ): Promise<contactsApiClientTypes.PatchContactResponse> {
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
      primaryAddress: journey.addressMetadata!.primaryAddress === 'YES',
      mailFlag: journey.addressMetadata!.mailAddress === 'YES',
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

  async updateContactAddress(journey: AddressJourney, user: Express.User) {
    const request: UpdateContactAddressRequest = {
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
      primaryAddress: journey.addressMetadata!.primaryAddress === 'YES',
      mailFlag: journey.addressMetadata!.mailAddress === 'YES',
      startDate: new Date(`${journey.addressMetadata!.fromYear}-${journey.addressMetadata!.fromMonth}-01Z`),
      endDate:
        journey.addressMetadata!.toMonth && journey.addressMetadata!.toYear
          ? new Date(`${journey.addressMetadata!.toYear}-${journey.addressMetadata!.toMonth}-01Z`)
          : undefined,
      noFixedAddress: journey.addressLines!.noFixedAddress,
      comments: journey.addressMetadata!.comments,
      updatedBy: user.username,
    }
    return this.contactsApiClient.updateContactAddress(journey.contactId, journey.contactAddressId!, request, user)
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
}
