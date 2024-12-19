declare namespace contactsApiClientTypes {
  import { components } from '../contactsApi'

  export type CreateContactRequest = components['schemas']['CreateContactRequest']
  export type ContactDetails = components['schemas']['ContactDetails']
  export type ContactCreationResult = components['schemas']['ContactCreationResult']
  export type PrisonerContactRelationshipDetails = components['schemas']['PrisonerContactRelationshipDetails']
  export type ContactAddressDetails = components['schemas']['ContactAddressDetails']
  export type PrisonerContactSummary = components['schemas']['PrisonerContactSummary']
  export type PrisonerContactSummaryPage = components['schemas']['PrisonerContactSummaryPage']
  export type ReferenceCode = components['schemas']['ReferenceCode']
  export type ContactSearchRequest = components['schemas']['ContactSearchRequest']
  export type ContactSearchResultItemPage = components['schemas']['ContactSearchResultItemPage']
  export type Pageable = components['schemas']['Pageable']
  export type AddContactRelationshipRequest = components['schemas']['AddContactRelationshipRequest']
  export type CreatePhoneRequest = components['schemas']['CreatePhoneRequest']
  export type UpdatePhoneRequest = components['schemas']['UpdatePhoneRequest']
  export type ContactPhoneDetails = components['schemas']['ContactPhoneDetails']
  export type CreateIdentityRequest = components['schemas']['CreateIdentityRequest']
  export type UpdateIdentityRequest = components['schemas']['UpdateIdentityRequest']
  export type ContactIdentityDetails = components['schemas']['ContactIdentityDetails']
  export type PatchContactRequest = components['schemas']['PatchContactRequest']
  export type PatchContactResponse = components['schemas']['PatchContactResponse']
  export type UpdateRelationshipRequest = components['schemas']['UpdateRelationshipRequest']
  export type ContactEmailDetails = components['schemas']['ContactEmailDetails']
  export type ContactRestrictionDetails = components['schemas']['ContactRestrictionDetails']
  export type CreateContactRestrictionRequest = components['schemas']['CreateContactRestrictionRequest']
  export type PrisonerContactRestrictionDetails = components['schemas']['PrisonerContactRestrictionDetails']
  export type CreatePrisonerContactRestrictionRequest = components['schemas']['CreatePrisonerContactRestrictionRequest']
  export type UpdatePrisonerContactRestrictionRequest = components['schemas']['UpdatePrisonerContactRestrictionRequest']
  export type UpdateContactRestrictionRequest = components['schemas']['UpdateContactRestrictionRequest']
  export type PrisonerContactRestrictionsResponse = components['schemas']['PrisonerContactRestrictionsResponse']
  export type CreateContactAddressRequest = components['schemas']['CreateContactAddressRequest']
  export type UpdateContactAddressRequest = components['schemas']['UpdateContactAddressRequest']
  export type CreateContactAddressPhoneRequest = components['schemas']['CreateContactAddressPhoneRequest']
  export type UpdateContactAddressPhoneRequest = components['schemas']['UpdateContactAddressPhoneRequest']
  export type ContactAddressPhoneDetails = components['schemas']['ContactAddressPhoneDetails']
  export type LinkedPrisonerDetails = components['schemas']['LinkedPrisonerDetails']
}
