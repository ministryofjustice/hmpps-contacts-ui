declare namespace contactsApiClientTypes {
  import { components } from '../contactsApi'

  export type ContactDetails = components['schemas']['ContactDetails']
  export type ContactCreationResult = components['schemas']['ContactCreationResult']
  export type PrisonerContactRelationshipDetails = components['schemas']['PrisonerContactRelationshipDetails']
  export type ContactAddressDetails = components['schemas']['ContactAddressDetails']
  export type PagedModelPrisonerContactSummary = components['schemas']['PagedModelPrisonerContactSummary']
  export type ReferenceCode = components['schemas']['ReferenceCode']
  export type ContactSearchRequest = components['schemas']['ContactSearchRequest']
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
  export type OrganisationSummary = components['schemas']['OrganisationSummary']
  export type OrganisationSummaryResultItemPage = components['schemas']['OrganisationSummaryResultItemPage']
  export type PatchEmploymentsRequest = components['schemas']['PatchEmploymentsRequest']

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
}
