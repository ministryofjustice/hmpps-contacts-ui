declare namespace journeys {
  export interface CreateContactJourney {
    id: string
    lastTouched: string
    prisonerNumber: string
    isCheckingAnswers: boolean
    returnPoint: ReturnPoint
    names?: ContactNames
    dateOfBirth?: DateOfBirth
    relationship?: PrisonerContactRelationship
  }

  export interface ContactNames {
    title?: string
    lastName: string
    firstName: string
    middleName?: string
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

  type ReturnPointType = 'MANAGE_PRISONER_CONTACTS' | 'HOME'
  type YesOrNo = 'YES' | 'NO'
  type YesNoOrDoNotKnow = 'YES' | 'NO' | 'DO_NOT_KNOW'
  type PrisonerJourneyParams = { prisonerNumber: string; journeyId: string }
}
