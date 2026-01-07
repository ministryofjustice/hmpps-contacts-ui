import { OrganisationSummary } from '../organisationsApiClient'
import { ContactSearchResultItem } from '../contactsApiClient'

export interface AddContactJourney {
  id: string
  lastTouched: string
  prisonerNumber: string
  isCheckingAnswers: boolean
  mode?: 'EXISTING' | 'NEW' | undefined
  searchContact?:
    | {
        soundsLike?: boolean | undefined
        searchType?: string | undefined
        contact?: Partial<ContactNames>
        contactId?: string | undefined
        dateOfBirth?: Partial<DateOfBirth>
        page?: number
        sort?: string
      }
    | undefined
  isContactMatched?: 'YES' | 'NO_SEARCH_AGAIN' | 'NO_CREATE_NEW' | 'NO_GO_BACK_TO_CONTACT_LIST'
  isPossibleExistingRecordMatched?: 'YES' | 'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS' | 'NO_CONTINUE_ADDING_CONTACT'
  names?: ContactNames
  dateOfBirth?: DateOfBirth
  gender?: string | undefined
  domesticStatusCode?: string | undefined
  isStaff?: YesOrNo | undefined
  languageAndInterpreter?: LanguageAndInterpreterRequiredForm | undefined
  relationship?: PrisonerContactRelationship
  previousAnswers?: CreateContactJourneyPreviousAnswers | undefined
  contactId?: number | undefined
  matchingContactId?: number | undefined
  prisonerContactId?: number
  existingContact?: {
    deceasedDate?: string
  }
  addresses?: AddressForm[] | undefined
  pendingAddresses?: AddressForm[] | undefined
  newAddress?: AddressForm | undefined
  employments?: EmploymentDetails[] | undefined
  pendingEmployments?: EmploymentDetails[] | undefined
  newEmployment?: {
    organisationId?: number
  }
  organisationSearch?: {
    page: number
    searchTerm?: string
    sort?: string
  }
  phoneNumbers?: PhoneNumberForm[] | undefined
  identities?: IdentityForm[] | undefined
  emailAddresses?: EmailAddressForm[] | undefined
  possibleExistingRecords?: ContactSearchResultItem[] | undefined
}

export interface ContactNames {
  title?: string | undefined
  lastName: string
  firstName: string
  middleNames?: string | undefined
}

export interface DateOfBirth {
  isKnown: YesOrNo
  day?: number
  month?: number
  year?: number
}

export interface PrisonerContactRelationship {
  pendingNewRelationshipType?: string
  relationshipType?: string
  relationshipToPrisoner?: string
  isEmergencyContact?: boolean | undefined
  isNextOfKin?: boolean | undefined
  isApprovedVisitor?: boolean
  comments?: string | undefined
}

export interface CreateContactJourneyPreviousAnswers {
  names?: ContactNames | undefined
  dateOfBirth?: DateOfBirth | undefined
  relationship?: PrisonerContactRelationship | undefined
}

export interface ManageContactsJourney {
  id: string
  lastTouched: string
  search?: { searchTerm?: string | undefined }
  prisoner?: PrisonerDetails
  searchContact?: {
    contact?: Partial<ContactNames>
    dateOfBirth?: Partial<DateOfBirth>
    soundsLike?: boolean
    contactId?: string | undefined
  }
  contactId?: number
  activateListPage?: number
  inactivateListPage?: number
}

export interface UpdateEmploymentsJourney {
  id: string
  lastTouched: string
  contactId: number
  contactNames: ContactNames
  employments: EmploymentDetails[]
  employmentIdsToDelete?: number[]
  changeOrganisationId?: number
  organisationSearch: {
    page: number
    searchTerm?: string
    sort?: string
  }
}

export interface ChangeRelationshipTypeJourney {
  id: string
  lastTouched: string
  mode: 'all' | 'relationship-to-prisoner'
  prisonerNumber: string
  contactId: number
  prisonerContactId: number
  names: ContactNames
  relationshipType: string
  relationshipToPrisoner: string
}

export interface PrisonerDetails {
  prisonerNumber: string
  lastName: string
  firstName: string
  dateOfBirth: string
  prisonName?: string | undefined
  cellLocation?: string | undefined
  hasPrimaryAddress: boolean
  alertsCount: number
  restrictionsCount: number
}

export interface EmploymentDetails {
  employmentId?: number
  employer: OrganisationSummary
  isActive?: boolean
}

export interface AddRestrictionJourney {
  id: string
  lastTouched: string
  contactId: number
  prisonerContactId: number
  prisonerNumber: string
  restrictionClass: RestrictionClass
  contactNames: ContactNames
  restriction?: Restriction
}

export interface Restriction {
  type: string
  startDate?: string
  expiryDate?: string | undefined
  comments?: string | undefined
}

export interface AddressForm {
  addressType?: string | undefined
  addressLines?: AddressLines | undefined
  addressMetadata?: AddressMetadata | undefined
  phoneNumbers?: PhoneNumberForm[] | undefined
}

export interface AddressJourney extends AddressForm {
  id: string
  lastTouched: string
  contactId: number
  prisonerNumber?: string
  isCheckingAnswers: boolean
  contactNames: ContactNames
}

export interface AddressLines {
  noFixedAddress: boolean
  flat?: string | undefined | null
  property?: string | undefined | null
  street?: string | undefined | null
  area?: string | undefined | null
  cityCode?: string | undefined | null
  countyCode?: string | undefined | null
  postcode?: string | undefined | null
  countryCode: string
}

export interface AddressMetadata {
  fromMonth?: string | undefined
  fromYear?: string | undefined
  toMonth?: string | undefined
  toYear?: string | undefined
  primaryAddress?: boolean | undefined
  mailAddress?: boolean | undefined
  comments?: string | null | undefined
}

export interface PhoneNumberForm {
  type: string
  phoneNumber: string
  extension?: string | undefined
}

interface IdentityForm {
  identityType: string
  identityValue: string
  issuingAuthority?: string
}

interface EmailAddressForm {
  emailAddress: string
}

export interface LanguageAndInterpreterRequiredForm {
  language?: string | undefined
  interpreterRequired?: YesOrNo | undefined
}

type YesOrNo = 'YES' | 'NO'
type PrisonerJourneyParams = { prisonerNumber: string; journeyId: string }
export type RestrictionClass = 'CONTACT_GLOBAL' | 'PRISONER_CONTACT'

export type UpdateEmploymentJourneyParams = PrisonerJourneyParams & {
  contactId: string
  prisonerContactId: string
  employmentIdx: string
}
