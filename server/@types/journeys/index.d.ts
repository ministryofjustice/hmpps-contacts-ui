declare namespace journeys {
  export interface CreateContactJourney {
    id: string
    lastTouched: string
    prisonerNumber: string
    isCheckingAnswers: boolean
    names?: ContactNames
    dateOfBirth?: DateOfBirth
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

  export interface ManageContactsJourney {
    id: string
    lastTouched: string
    search?: {
      searchTerm?: string
    }
    prisoner?: {
      firstName?: string
      lastName?: string
      prisonerNumber?: string
      dateOfBirth?: string
      prisonId?: string
      prisonName?: string
    }
    contactId?: number
  }

  type YesOrNo = 'YES' | 'NO'
  type YesNoOrDoNotKnow = 'YES' | 'NO' | 'DO_NOT_KNOW'

  type PrisonerJourneyParams = { prisonerNumber: string; journeyId: string }
}
