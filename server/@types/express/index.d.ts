import { HmppsUser } from '../../interfaces/hmppsUser'
import { fieldErrors } from '../../middleware/validationMiddleware'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  import CreateContactJourney = journeys.CreateContactJourney
  import ManageContactsJourney = journeys.ManageContactsJourney

  interface SessionData {
    returnTo: string
    nowInMinutes: number
    prisonId: string
    prisonName: string
    search: string
    createContactJourneys: Record<string, CreateContactJourney>
    manageContactsJourneys: Record<string, ManageContactsJourney>
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
    }
  }
}
