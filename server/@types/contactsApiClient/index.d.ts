import { components } from '../contactsApi'

export type ContactDetails = components['schemas']['ContactDetails']
export type ContactCreationResult = components['schemas']['ContactCreationResult']
export type PrisonerContactRelationshipDetails = components['schemas']['PrisonerContactRelationshipDetails']
export type ContactAddressDetails = components['schemas']['ContactAddressDetails']
export type PagedModelPrisonerContactSummary = components['schemas']['PagedModelPrisonerContactSummary']
export type ReferenceCode = components['schemas']['ReferenceCode']
export type PagedModelContactSearchResultItem = components['schemas']['PagedModelContactSearchResultItem']
export type CreatePhoneRequest = components['schemas']['CreatePhoneRequest']
export type UpdatePhoneRequest = components['schemas']['UpdatePhoneRequest']
export type ContactPhoneDetails = components['schemas']['ContactPhoneDetails']
export type UpdateIdentityRequest = components['schemas']['UpdateIdentityRequest']
export type ContactIdentityDetails = components['schemas']['ContactIdentityDetails']
export type PatchContactRequest = components['schemas']['PatchContactRequest']
export type PatchContactResponse = components['schemas']['PatchContactResponse']
export type PatchRelationshipRequest = components['schemas']['PatchRelationshipRequest']
export type ContactEmailDetails = components['schemas']['ContactEmailDetails']
export type ContactRestrictionDetails = components['schemas']['ContactRestrictionDetails']
export type CreateContactRestrictionRequest = components['schemas']['CreateContactRestrictionRequest']
export type PrisonerContactRestrictionDetails = components['schemas']['PrisonerContactRestrictionDetails']
export type CreatePrisonerContactRestrictionRequest = components['schemas']['CreatePrisonerContactRestrictionRequest']
export type UpdatePrisonerContactRestrictionRequest = components['schemas']['UpdatePrisonerContactRestrictionRequest']
export type UpdateContactRestrictionRequest = components['schemas']['UpdateContactRestrictionRequest']
export type PrisonerContactRestrictionsResponse = components['schemas']['PrisonerContactRestrictionsResponse']
export type CreateContactAddressRequest = components['schemas']['CreateContactAddressRequest']
export type PatchContactAddressRequest = components['schemas']['PatchContactAddressRequest']
export type UpdateContactAddressPhoneRequest = components['schemas']['UpdateContactAddressPhoneRequest']
export type ContactAddressPhoneDetails = components['schemas']['ContactAddressPhoneDetails']
export type PatchEmploymentsRequest = components['schemas']['PatchEmploymentsRequest']
export type PrisonerContactSummary = components['schemas']['PrisonerContactSummary']
export type UpdateEmailRequest = components['schemas']['UpdateEmailRequest']
export type CreateContactRequest = components['schemas']['CreateContactRequest']
export type AddContactRelationshipRequest = components['schemas']['AddContactRelationshipRequest']
export type ContactNameDetails = components['schemas']['ContactNameDetails']
export type CreateMultipleIdentitiesRequest = components['schemas']['CreateMultipleIdentitiesRequest']
export type IdentityDocument = components['schemas']['IdentityDocument']
export type PagedModelLinkedPrisonerDetails = components['schemas']['PagedModelLinkedPrisonerDetails']
export type PagedModelPrisonerRestrictionDetails = components['schemas']['PagedModelPrisonerRestrictionDetails']
export type CreateMultipleEmailsRequest = components['schemas']['CreateMultipleEmailsRequest']
export type EmailAddress = components['schemas']['EmailAddress']
export type CreateMultiplePhoneNumbersRequest = components['schemas']['CreateMultiplePhoneNumbersRequest']
export type UpdateContactAddressRequest = components['schemas']['UpdateContactAddressRequest']
export type ContactSearchResultItem = components['schemas']['ContactSearchResultItem']
export type ContactPhoneNumberDetails = components['schemas']['ContactPhoneDetails']
export type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']
export type EmploymentDetails = components['schemas']['EmploymentDetails']
export type RelationshipDeletePlan = components['schemas']['RelationshipDeletePlan']

export type PrisonerContactFilter = {
  active?: boolean
  relationshipType?: 'O' | 'S'
  emergencyContact?: boolean
  nextOfKin?: boolean
  emergencyContactOrNextOfKin?: boolean
}

export type PrisonerContactPagination = {
  page: number
  size: number
  sort?: string[]
}

export type ContactSearchRequest = {
  lastName: string
  firstName?: string | undefined
  middleNames?: string | undefined
  dateOfBirth?: string | null
  includeAnyExistingRelationshipsToPrisoner?: string | undefined
}
