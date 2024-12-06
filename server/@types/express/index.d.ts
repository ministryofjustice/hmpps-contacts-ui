import { HmppsUser } from '../../interfaces/hmppsUser'
import { fieldErrors } from '../../middleware/validationMiddleware'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  import AddContactJourney = journeys.AddContactJourney
  import ManageContactsJourney = journeys.ManageContactsJourney
  import UpdateDateOfBirthJourney = journeys.UpdateDateOfBirthJourney
  import AddRestrictionJourney = journeys.AddRestrictionJourney
  import AddressJourney = journeys.AddressJourney

  interface SessionData {
    returnTo: string
    nowInMinutes: number
    prisonId: string
    prisonName: string
    search: string
    addContactJourneys: Record<string, AddContactJourney>
    manageContactsJourneys: Record<string, ManageContactsJourney>
    updateDateOfBirthJourneys: Record<string, UpdateDateOfBirthJourney>
    addRestrictionJourneys: Record<string, AddRestrictionJourney>
    addressJourneys: Record<string, AddressJourney>
  }
}
export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: HmppsUser
      validationErrors?: fieldErrors
      digitalPrisonServicesUrl: string
    }
  }
}
