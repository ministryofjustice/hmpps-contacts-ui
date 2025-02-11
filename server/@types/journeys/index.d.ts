declare namespace journeys {
  import OrganisationSummary = contactsApiClientTypes.OrganisationSummary
  import OrganisationDetails = organisationsApiClientTypes.OrganisationDetails

  export interface AddContactJourney {
    id: string
    lastTouched: string
    prisonerNumber: string
    isCheckingAnswers: boolean
    returnPoint: ReturnPoint
    mode?: 'EXISTING' | 'NEW'
    searchContact?: {
      contact?: Partial<ContactNames>
      dateOfBirth?: Partial<DateOfBirth>
    }
    isContactConfirmed?: YesOrNo
    names?: ContactNames
    dateOfBirth?: DateOfBirth
    relationship?: PrisonerContactRelationship
    previousAnswers?: CreateContactJourneyPreviousAnswers
    contactId?: number
    prisonerContactId?: number
    existingContact?: {
      isDeceased?: boolean
      deceasedDate?: string
    }
  }

  export interface ContactNames {
    title?: string
    lastName: string
    firstName: string
    middleNames?: string
  }

  export interface DateOfBirth {
    isKnown: YesOrNo
    day?: number
    month?: number
    year?: number
  }

  export interface PrisonerContactRelationship {
    relationshipType?: string
    relationshipToPrisoner?: string
    isEmergencyContact?: YesOrNo
    isNextOfKin?: YesOrNo
    comments?: string
  }

  export interface CreateContactJourneyPreviousAnswers {
    names?: ContactNames
    dateOfBirth?: DateOfBirth
    relationship?: PrisonerContactRelationship
  }

  export interface ManageContactsJourney {
    id: string
    lastTouched: string
    search?: {
      searchTerm?: string
    }
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
    returnPoint: ReturnPoint
    changeOrganisationId?: number
    changeOrganisation?: OrganisationDetails
    organisationSearch: {
      page: number
      searchTerm?: string
      sort?: string
    }
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
    prisonName?: string
    cellLocation?: string
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
    expiryDate?: string
    comments?: string
  }

  export interface AddressJourney {
    id: string
    lastTouched: string
    contactId: number
    prisonerNumber?: string
    contactAddressId?: number
    returnPoint: ReturnPoint
    isCheckingAnswers: boolean
    mode: 'ADD' | 'EDIT'
    contactNames: ContactNames
    addressType?: string
    addressLines?: AddressLines
    addressMetadata?: AddressMetadata
  }

  export interface AddressLines {
    noFixedAddress: boolean
    flat?: string
    premises?: string
    street?: string
    locality?: string
    town?: string
    county?: string
    postcode?: string
    country: string
  }

  export interface AddressMetadata {
    fromMonth?: string
    fromYear?: string
    toMonth?: string
    toYear?: string
    primaryAddress?: YesOrNo
    mailAddress?: YesOrNo
    comments?: string
  }

  export interface StandaloneManageContactJourney {
    returnPoint: ReturnPoint
    names?: ContactNames
    contactNames?: ContactNames
    restrictionClass?: RestrictionClass
    contactId?: string
  }

  type YesOrNo = 'YES' | 'NO'
  type PrisonerJourneyParams = { prisonerNumber: string; journeyId: string }
  export type RestrictionClass = 'CONTACT_GLOBAL' | 'PRISONER_CONTACT'

  export type UpdateEmploymentJourneyParams = PrisonerJourneyParams & {
    contactId: string
    employmentIdx: string
  }
}
