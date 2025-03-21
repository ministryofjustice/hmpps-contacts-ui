declare namespace journeys {
  import OrganisationSummary = contactsApiClientTypes.OrganisationSummary
  import OrganisationDetails = organisationsApiClientTypes.OrganisationDetails

  export interface AddContactJourney {
    id: string
    lastTouched: string
    prisonerNumber: string
    isCheckingAnswers: boolean
    returnPoint: ReturnPoint
    mode?: 'EXISTING' | 'NEW' | undefined
    searchContact?: {
      contact?: Partial<ContactNames>
      dateOfBirth?: Partial<DateOfBirth>
    }
    isContactConfirmed?: YesOrNo
    names?: ContactNames
    dateOfBirth?: DateOfBirth
    gender?: string | undefined
    domesticStatusCode?: string | undefined
    isStaff?: YesOrNo | undefined
    languageAndInterpreter?: LanguageAndInterpreterRequiredForm | undefined
    relationship?: PrisonerContactRelationship
    previousAnswers?: CreateContactJourneyPreviousAnswers | undefined
    contactId?: number
    prisonerContactId?: number
    existingContact?: {
      deceasedDate?: string
    }
    addresses?: AddressForm[] | undefined
    pendingAddresses?: AddressForm[] | undefined
    newAddress?: AddressForm | undefined
    phoneNumbers?: PhoneNumberForm[] | undefined
    identities?: IdentityForm[] | undefined
    emailAddresses?: EmailAddressForm[] | undefined
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
    isEmergencyContact?: YesOrNo
    isNextOfKin?: YesOrNo
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
    returnPoint: ReturnPoint
    changeOrganisationId?: number
    changeOrganisation?: OrganisationDetails
    organisationSearch: {
      page: number
      searchTerm?: string
      sort?: string
    }
  }

  export interface ChangeRelationshipTypeJourney {
    id: string
    lastTouched: string
    prisonerNumber: string
    contactId: number
    prisonerContactId: number
    names: ContactNames
    relationshipType: string
    relationshipToPrisoner: string
  }

  export interface ReturnPoint {
    url: string
    anchor?: string
  }

  export interface PrisonerDetails {
    prisonerNumber: string
    lastName: string
    firstName: string
    dateOfBirth: string
    prisonName?: string | undefined
    cellLocation?: string | undefined
    hasPrimaryAddress: boolean
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
    prisonerContactId?: number
    prisonerNumber?: string
    returnPoint: ReturnPoint
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

  export interface StandaloneManageContactJourney {
    returnPoint: ReturnPoint
    names?: ContactNames
    contactNames?: ContactNames
    restrictionClass?: RestrictionClass
    contactId?: string
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
    employmentIdx: string
  }
}
