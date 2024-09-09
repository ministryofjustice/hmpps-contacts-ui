declare namespace journeys {
  export interface CreateContactJourney {
    id: string
    lastTouched: string
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
    isKnown: 'Yes' | 'No'
    day?: number
    month?: number
    year?: number
    isOverEighteen?: 'Yes' | 'No' | 'Do not know'
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
}
