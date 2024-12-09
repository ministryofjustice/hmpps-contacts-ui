declare namespace journeys {
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
    isOverEighteen?: YesNoOrDoNotKnow
  }

  export interface PrisonerContactRelationship {
    type?: string
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

  export interface ReturnPoint {
    url: string
  }

  export interface PrisonerDetails {
    prisonerNumber: string
    lastName: string
    firstName: string
    dateOfBirth: string
    prisonName: string
    cellLocation?: string
  }

  export interface UpdateDateOfBirthJourney {
    id: string
    lastTouched: string
    returnPoint: ReturnPoint
    prisonerNumber: string
    contactId: number
    names: ContactNames
    dateOfBirth?: DateOfBirth
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
    contactNames: ContactNames
    addressType?: string
    addressLines?: AddressLines
    addressMetadata?: string[]
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

  export interface StandaloneManageContactJourney {
    returnPoint: ReturnPoint
  }

  type YesOrNo = 'YES' | 'NO'
  type YesNoOrDoNotKnow = 'YES' | 'NO' | 'DO_NOT_KNOW'
  type PrisonerJourneyParams = { prisonerNumber: string; journeyId: string }
  type RestrictionClass = 'CONTACT_GLOBAL' | 'PRISONER_CONTACT'
}
