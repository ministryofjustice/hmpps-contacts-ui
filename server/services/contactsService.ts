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
type ContactEmailDetails = components['schemas']['ContactEmailDetails']
type CreateContactRequest = components['schemas']['CreateContactRequest']
type AddContactRelationshipRequest = components['schemas']['AddContactRelationshipRequest']
type ContactNameDetails = components['schemas']['ContactNameDetails']
type CreateMultipleIdentitiesRequest = components['schemas']['CreateMultipleIdentitiesRequest']
type IdentityDocument = components['schemas']['IdentityDocument']
type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']
type CreateMultipleEmailsRequest = components['schemas']['CreateMultipleEmailsRequest']
type CreateMultiplePhoneNumbersRequest = components['schemas']['CreateMultiplePhoneNumbersRequest']

export default class ContactsService {
  constructor(private readonly contactsApiClient: ContactsApiClient) {}

  async createContact(journey: AddContactJourney, user: Express.User): Promise<ContactCreationResult> {
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
        isNextOfKin: journey.relationship!.isNextOfKin === 'YES',
        isEmergencyContact: journey.relationship!.isEmergencyContact === 'YES',
        isApprovedVisitor: false,
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

  async createContactPhones(
    contactId: number,
    user: Express.User,
    phones: { type: string; phoneNumber: string; extension?: string | undefined }[],
  ) {
    const request: CreateMultiplePhoneNumbersRequest = {
      phoneNumbers: phones.map(({ type, phoneNumber, extension }) => ({
        phoneType: type,
        phoneNumber,
        ...(extension === undefined ? {} : { extNumber: extension }),
      })),
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactPhones(contactId, request, user)
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

  async createContactEmails(
    contactId: number,
    request: CreateMultipleEmailsRequest,
    user: Express.User,
  ): Promise<ContactEmailDetails[]> {
    return this.contactsApiClient.createContactEmails(contactId, request, user)
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

  async createContactAddressPhones(
    contactId: number,
    contactAddressId: number,
    user: Express.User,
    phones: { type: string; phoneNumber: string; extension?: string | undefined }[],
  ) {
    const request: CreateMultiplePhoneNumbersRequest = {
      phoneNumbers: phones.map(({ type, phoneNumber, extension }) => ({
        phoneType: type,
        phoneNumber,
        ...(extension === undefined ? {} : { extNumber: extension }),
      })),
      createdBy: user.username,
    }
    return this.contactsApiClient.createContactAddressPhones(contactId, contactAddressId, request, user)
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
