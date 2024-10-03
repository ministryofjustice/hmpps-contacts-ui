declare namespace contactsApiClientTypes {
  import { components } from '../contactsApi'

  export type CreateContactRequest = components['schemas']['CreateContactRequest']
  export type Contact = components['schemas']['Contact']
  export type PrisonerContactSummary = components['schemas']['PrisonerContactSummary']
  export type ReferenceCode = components['schemas']['ReferenceCode']
  export type ContactSearchRequest = components['schemas']['ContactSearchRequest']
  export type ContactSearchResultItemPage = components['schemas']['ContactSearchResultItemPage']
  export type Pageable = components['schema']['Pageable']
  export type AddContactRelationshipRequest = components['schema']['AddContactRelationshipRequest']
}
