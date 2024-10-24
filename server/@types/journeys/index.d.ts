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
    type: ReturnPointType
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

  type ReturnPointType = 'MANAGE_PRISONER_CONTACTS' | 'PRISONER_CONTACTS'
  type YesOrNo = 'YES' | 'NO'
  type YesNoOrDoNotKnow = 'YES' | 'NO' | 'DO_NOT_KNOW'
  type PrisonerJourneyParams = { prisonerNumber: string; journeyId: string }
}
