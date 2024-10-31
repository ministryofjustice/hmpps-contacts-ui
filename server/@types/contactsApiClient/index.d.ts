declare namespace contactsApiClientTypes {
  import { components } from '../contactsApi'

  export type CreateContactRequest = components['schemas']['CreateContactRequest']
  export type Contact = components['schemas']['Contact']
  export type GetContactResponse = components['schemas']['GetContactResponse']
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
  export type PatchContactRequest = components['schemas']['PatchContactRequest']
  export type PatchContactResponse = components['schemas']['PatchContactResponse']
}
